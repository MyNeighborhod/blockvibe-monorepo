"use client"

import React, { useState, useEffect, useRef } from "react"
import { Paperclip, Send, X, Image as ImageIcon, AlertTriangle, User, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Attachment {
  url: string
  name: string
  contentType: string
}

interface Message {
  role: "user" | "assistant"
  content: string
  experimental_attachments?: Attachment[]
}

interface ChatInterfaceProps {
  chatServiceUrl: string
}

export function ChatInterface({ chatServiceUrl }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your BlockVibe Documentation Assistant. I can help you manage your neighborhood site, explain roles, configure email settings, and more based on the platform's manual.\n\nFeel free to paste a screenshot here if you run into any errors!",
    },
  ])
  const [input, setInput] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch token on mount
  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch("/api/chat/token")
        if (res.ok) {
          const data = await res.json()
          setToken(data.token)
        } else {
          setError("Failed to authenticate chat session. Please re-login.")
        }
      } catch (err) {
        setError("Error establishing secure chat connection.")
      }
    }
    fetchToken()
  }, [])

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  // Clipboard Paste Handler (Supports screenshot paste)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile()
        if (file) {
          processImageFile(file)
        }
      }
    }
  }

  // Handle manual file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    for (let i = 0; i < files.length; i++) {
      processImageFile(files[i])
    }
  }

  // Process file into Base64 Data URL
  const processImageFile = (file: File) => {
    if (file.size > 4 * 1024 * 1024) {
      alert("Please upload images smaller than 4MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      if (result) {
        setAttachments((prev) => [
          ...prev,
          {
            url: result,
            name: file.name || "pasted-screenshot.png",
            contentType: file.type || "image/png",
          },
        ])
      }
    }
    reader.readAsDataURL(file)
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  // Handle Form Submit
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() && attachments.length === 0) return
    if (!token) {
      setError("Secure token is missing. Please refresh the page.")
      return
    }

    const userMessage: Message = {
      role: "user",
      content: input,
      experimental_attachments: attachments.length > 0 ? attachments : undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setAttachments([])
    setLoading(true)
    setError(null)

    // Build message history to send (including current message)
    const chatHistory = [...messages, userMessage].map((msg) => ({
      role: msg.role,
      content: msg.content,
      experimental_attachments: msg.experimental_attachments?.map((att) => ({
        url: att.url,
        contentType: att.contentType,
      })),
    }))

    try {
      const res = await fetch(`${chatServiceUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: chatHistory }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `HTTP error ${res.status}`)
      }

      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.text || "I was unable to retrieve a response.",
        },
      ])
    } catch (err: any) {
      console.error("Chat error:", err)
      setError(err.message || "Failed to communicate with AI chat service.")
    } finally {
      setLoading(false)
    }
  }

  // Simple Regex-based Markdown to HTML renderer for clean UI representation
  const renderMessageContent = (text: string) => {
    let formatted = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

    // Code Blocks (```code```)
    formatted = formatted.replace(
      /```([\s\S]*?)```/g,
      '<pre class="bg-zinc-950 text-zinc-100 p-4 rounded-lg my-2 font-mono text-sm overflow-x-auto border border-zinc-800">$1</pre>',
    )

    // Inline Code (`code`)
    formatted = formatted.replace(
      /`([^`]+)`/g,
      '<code class="bg-muted px-1.5 py-0.5 rounded font-mono text-sm border border-border/40">$1</code>',
    )

    // Bold (**text**)
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")

    // Unordered Lists
    formatted = formatted.replace(/^\s*-\s+(.+)$/gm, '<li class="list-disc ml-6 py-0.5">$1</li>')

    // Attributions (answered by Gemini/Cursor)
    formatted = formatted.replace(
      /\((answered by [^)]+)\)/gi,
      '<span class="text-xs text-muted-foreground block mt-2 italic border-t border-border/40 pt-1">$1</span>',
    )

    // Newlines to line breaks (excluding pre/li blocks)
    formatted = formatted.split("\n").join("<br />")

    return <div dangerouslySetInnerHTML={{ __html: formatted }} className="space-y-1.5" />
  }

  return (
    <div className="flex flex-col h-[70vh] border border-border/60 rounded-xl bg-card/40 backdrop-blur-sm shadow-lg overflow-hidden">
      {/* Scope Warning Bar */}
      <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span>
          This assistant is under a strict SOP. It is restricted to answering questions related to
          BlockVibe documentation and site management.
        </span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-sm">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
          >
            {/* Avatar */}
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                msg.role === "user"
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : "bg-muted border-border text-muted-foreground"
              }`}
            >
              {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            {/* Bubble */}
            <div className="space-y-2">
              <div
                className={`p-3.5 rounded-2xl shadow-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-muted/70 text-foreground border border-border/40 rounded-tl-none"
                }`}
              >
                {renderMessageContent(msg.content)}
              </div>

              {/* Render User Attachments */}
              {msg.experimental_attachments && msg.experimental_attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-end">
                  {msg.experimental_attachments.map((att, i) => (
                    <div
                      key={i}
                      className="border border-border/40 rounded-lg overflow-hidden max-w-[200px] shadow-sm bg-muted/20"
                    >
                      <img
                        src={att.url}
                        alt="Attachment"
                        className="max-h-[120px] w-auto object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex gap-3 max-w-[85%] mr-auto items-center">
            <div className="h-8 w-8 rounded-full bg-muted border border-border text-muted-foreground flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-muted/40 text-muted-foreground px-4 py-2.5 rounded-2xl rounded-tl-none border border-border/20 flex items-center gap-2">
              <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        {/* Session / API Errors */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-lg flex items-center gap-2 max-w-[85%] mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 bg-muted/40 border-t border-border/40 flex flex-wrap gap-3">
          {attachments.map((att, index) => (
            <div
              key={index}
              className="relative border border-border/60 rounded-lg p-1 bg-card flex items-center gap-2 shadow-sm"
            >
              <img
                src={att.url}
                alt="Attachment Preview"
                className="h-10 w-10 object-cover rounded"
              />
              <div className="text-xs max-w-[120px] truncate pr-4">
                <p className="font-medium truncate">{att.name}</p>
                <p className="text-[10px] text-muted-foreground">Screenshot</p>
              </div>
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/80 transition-colors shadow-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        onPaste={handlePaste}
        className="p-3 border-t border-border/40 bg-card/60 flex items-center gap-2"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          multiple
          className="hidden"
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="text-muted-foreground hover:text-foreground flex-shrink-0"
          title="Upload image/screenshot"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question or paste a screenshot (Cmd+V)..."
          disabled={loading || !token}
          className="flex-1 min-h-[40px] px-3.5 py-2 rounded-lg bg-background border border-border/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />

        <Button
          type="submit"
          size="icon"
          disabled={loading || (!input.trim() && attachments.length === 0) || !token}
          className="flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
