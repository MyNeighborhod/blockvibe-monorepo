"use client"

import React, { useEffect } from "react"

const EYE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>`
const EYE_OFF_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-off"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`

export function PasswordToggleProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const applyToggle = (input: HTMLInputElement) => {
      if (input.getAttribute("data-has-password-toggle") === "true") return

      // Ensure the parent container has relative positioning
      const parent = input.parentElement
      if (!parent) return
      parent.style.position = "relative"

      input.setAttribute("data-has-password-toggle", "true")

      // Create toggle button
      const button = document.createElement("button")
      button.type = "button"
      button.className = "password-toggle-btn"
      button.innerHTML = EYE_SVG
      button.setAttribute("aria-label", "Show password")

      // Click event
      button.onclick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (input.type === "password") {
          input.type = "text"
          input.setAttribute("data-show-password", "true")
          button.innerHTML = EYE_OFF_SVG
          button.setAttribute("aria-label", "Hide password")
        } else {
          input.type = "password"
          input.removeAttribute("data-show-password")
          button.innerHTML = EYE_SVG
          button.setAttribute("aria-label", "Show password")
        }
      }

      // Insert after the input
      parent.appendChild(button)
    }

    // Scan initial inputs
    const inputs = document.querySelectorAll('input[type="password"]')
    inputs.forEach((el) => applyToggle(el as HTMLInputElement))

    // Set up MutationObserver to watch for newly rendered inputs (e.g. login form, user forms)
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              if (node.tagName === "INPUT" && node.getAttribute("type") === "password") {
                applyToggle(node as HTMLInputElement)
              } else {
                const nestedInputs = node.querySelectorAll('input[type="password"]')
                nestedInputs.forEach((el) => applyToggle(el as HTMLInputElement))
              }
            }
          })
        }
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  return <>{children}</>
}

export default PasswordToggleProvider
