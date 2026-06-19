"use client"

import React, { useState, useEffect } from "react"
import { MessageSquare, X } from "lucide-react"
import { ChatInterface } from "../../app/(frontend)/[tenant]/(dashboard)/dashboard/chat/ChatInterface"
import "./index.scss"

export function AdminChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const chatUrl = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "http://localhost:4002"

  return (
    <>
      {children}
      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="admin-chat-fab"
        title="Open Documentation AI Assistant"
      >
        <MessageSquare className="h-6 w-6" />
        <span className="admin-chat-fab-pulse" />
      </button>

      {/* Slide-over Chat Drawer */}
      {isOpen && (
        <div className="admin-chat-drawer-overlay">
          {/* Backdrop */}
          <div className="admin-chat-drawer-backdrop" onClick={() => setIsOpen(false)} />

          {/* Drawer Container */}
          <div className="admin-chat-drawer-content">
            {/* Header */}
            <div className="admin-chat-drawer-header">
              <div>
                <h3 className="admin-chat-drawer-title">Documentation AI</h3>
                <p className="admin-chat-drawer-subtitle">
                  Ask questions about BlockVibe & Site Management
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="admin-chat-drawer-close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Frame */}
            <div className="admin-chat-drawer-body">
              <ChatInterface chatServiceUrl={chatUrl} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AdminChatProvider
