"use client"

import React, { useEffect, useRef, useState } from "react"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
} from "lucide-react"

interface RichTextEditorProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  uploadImage?: (file: File) => Promise<string>
  onUploadError?: (message: string) => void
}

export function RichTextEditor({
  id,
  value,
  onChange,
  placeholder,
  uploadImage,
  onUploadError,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Sync value prop to innerHTML, but only when it changes from outside
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ""
    }
  }, [value])

  const executeCommand = (command: string, arg: string = "") => {
    if (editorRef.current) {
      editorRef.current.focus()
    }
    document.execCommand(command, false, arg)
    triggerChange()
  }

  const triggerChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleLink = () => {
    const url = prompt("Enter the URL:")
    if (url) {
      executeCommand("createLink", url)
    }
  }

  const handleImageUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const insertImage = (src: string) => {
    if (editorRef.current) {
      editorRef.current.focus()
    }
    const imgHtml = `<img src="${src}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; display: block; border: 1px solid rgba(128,128,128,0.2);" alt="Embedded image" />`
    document.execCommand("insertHTML", false, imgHtml)
    triggerChange()
  }

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string)
        } else {
          reject(new Error("Failed to read image file."))
        }
      }
      reader.onerror = () => reject(new Error("Failed to read image file."))
      reader.readAsDataURL(file)
    })

  const insertImageFromFile = async (file: File) => {
    setIsUploadingImage(true)
    try {
      const src = uploadImage ? await uploadImage(file) : await readFileAsDataUrl(file)
      insertImage(src)
    } catch (err: any) {
      const message = err?.message || "Failed to insert image."
      onUploadError?.(message)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      void insertImageFromFile(files[0])
    }
    e.target.value = ""
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    // Intercept image pastes (from clipboard screenshots/copies)
    const items = e.clipboardData.items
    let hasImage = false
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          hasImage = true
          void insertImageFromFile(file)
        }
      }
    }

    if (hasImage) {
      e.preventDefault()
      return
    }

    // For other rich content (Google Docs formatting etc.), let the browser paste naturally
    // but capture the updated content in NextTick
    setTimeout(() => {
      triggerChange()
    }, 0)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.indexOf("image") !== -1) {
          void insertImageFromFile(files[i])
        }
      }
    }
  }

  return (
    <div
      className={`flex flex-col rounded-md border bg-transparent transition-all shadow-sm ${
        isFocused ? "border-primary ring-1 ring-ring" : "border-input"
      }`}
    >
      {/* Hidden file input for image uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 items-center border-b border-border/40 bg-muted/30 p-2.5">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            executeCommand("bold")
          }}
          title="Bold"
          className="h-8 w-8 rounded flex items-center justify-center text-foreground hover:bg-muted-foreground/10 transition-colors"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            executeCommand("italic")
          }}
          title="Italic"
          className="h-8 w-8 rounded flex items-center justify-center text-foreground hover:bg-muted-foreground/10 transition-colors"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            executeCommand("underline")
          }}
          title="Underline"
          className="h-8 w-8 rounded flex items-center justify-center text-foreground hover:bg-muted-foreground/10 transition-colors"
        >
          <Underline className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            executeCommand("strikeThrough")
          }}
          title="Strikethrough"
          className="h-8 w-8 rounded flex items-center justify-center text-foreground hover:bg-muted-foreground/10 transition-colors"
        >
          <Strikethrough className="h-4 w-4" />
        </button>

        <div className="w-px h-5 bg-border/50 mx-1" />

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            executeCommand("formatBlock", "h1")
          }}
          title="Heading 1"
          className="h-8 w-8 rounded flex items-center justify-center text-foreground hover:bg-muted-foreground/10 transition-colors font-bold"
        >
          <Heading1 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            executeCommand("formatBlock", "h2")
          }}
          title="Heading 2"
          className="h-8 w-8 rounded flex items-center justify-center text-foreground hover:bg-muted-foreground/10 transition-colors font-bold"
        >
          <Heading2 className="h-4 w-4" />
        </button>

        <div className="w-px h-5 bg-border/50 mx-1" />

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            executeCommand("insertUnorderedList")
          }}
          title="Bullet List"
          className="h-8 w-8 rounded flex items-center justify-center text-foreground hover:bg-muted-foreground/10 transition-colors"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            executeCommand("insertOrderedList")
          }}
          title="Numbered List"
          className="h-8 w-8 rounded flex items-center justify-center text-foreground hover:bg-muted-foreground/10 transition-colors"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <div className="w-px h-5 bg-border/50 mx-1" />

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            handleLink()
          }}
          title="Insert Link"
          className="h-8 w-8 rounded flex items-center justify-center text-foreground hover:bg-muted-foreground/10 transition-colors"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            handleImageUploadClick()
          }}
          title="Insert Image"
          disabled={isUploadingImage}
          className="h-8 w-8 rounded flex items-center justify-center text-foreground hover:bg-muted-foreground/10 transition-colors disabled:opacity-50"
        >
          <ImageIcon className="h-4 w-4" />
        </button>

        <div className="w-px h-5 bg-border/50 mx-1 flex-grow md:flex-grow-0" />

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            executeCommand("undo")
          }}
          title="Undo"
          className="h-8 w-8 rounded flex items-center justify-center text-foreground hover:bg-muted-foreground/10 transition-colors ml-auto md:ml-0"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            executeCommand("redo")
          }}
          title="Redo"
          className="h-8 w-8 rounded flex items-center justify-center text-foreground hover:bg-muted-foreground/10 transition-colors"
        >
          <Redo className="h-4 w-4" />
        </button>
      </div>

      {/* Editor Area */}
      <div className="relative min-h-[300px] flex flex-col">
        {(!value || value === "<br>") && placeholder && (
          <div className="absolute top-3 left-4 text-sm text-muted-foreground pointer-events-none select-none">
            {placeholder}
          </div>
        )}
        <div
          id={id}
          ref={editorRef}
          contentEditable
          onInput={triggerChange}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false)
            triggerChange()
          }}
          className="flex-1 w-full p-4 text-sm focus-visible:outline-none overflow-y-auto max-h-[500px] prose dark:prose-invert prose-sm max-w-none [&_img]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline"
          style={{ minHeight: "300px" }}
        />
      </div>
    </div>
  )
}
