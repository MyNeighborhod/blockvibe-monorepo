# Overlay Visual Builder for PayloadCMS Pages

The **Overlay Visual Builder** provides an **in-context, live visual editing experience** directly on top of frontend Next.js pages for PayloadCMS administrators and editors.

Unlike canvas-based editors that isolate blocks inside an iframe or require JSON-to-component mappings (such as Puck or GrapesJS), the Overlay Visual Builder operates directly on Payload's native `layout` (Blocks) collection field.

---

## Key Features

1. **In-Context Visual Overlay (`BlockOverlayWrapper`)**:
   - Hovering over any section block displays a glowing border outline.
   - Quick action controls appear above the block:
     - ✏️ **Edit**: Opens the Slide-Out Inspector Drawer for modifying text, links, and settings.
     - 🔼 **Up** / 🔽 **Down**: Move block position in layout.
     - 📋 **Duplicate**: Clone block instantly.
     - 🗑️ **Delete**: Remove section block.
     - ➕ **Add Block Below**: Insert a new section at any position.

2. **Top Admin Floating Bar (`OverlayBuilderToolbar`)**:
   - Displays for authenticated staff members (`superadmin`, `admin`, `editor`).
   - Toggle **Visual Edit Mode** ON/OFF anytime while browsing.
   - Real-time unsaved changes indicator (`isDirty`).
   - One-click **Save Page** button that triggers a Server Action (`savePageOverlayLayoutAction`) to persist changes directly to Payload's `pages` collection and revalidate cache.

3. **Slide-Out Inspector Drawer (`BlockInspectorDrawer`)**:
   - Slide-out panel for modifying section fields (CTA title & links, Content columns, Contact info, Map settings, Media options).

4. **Block Templates Gallery (`BlockLibraryModal`)**:
   - Insert pre-configured block templates (CTA, Hero, Content, Media, Slideshow, Form, Archive, Documents, Contact).

---

## Technical Architecture

- **`src/components/OverlayVisualBuilder/`**:
  - `OverlayVisualBuilderContext.tsx`: React Context for managing layout blocks, editing state, drawer visibility, and persistence.
  - `OverlayBuilderToolbar.tsx`: Sticky top control bar for toggling edit mode and saving.
  - `BlockOverlayWrapper.tsx`: Interactive hover outline and block controls wrapper.
  - `BlockInspectorDrawer.tsx`: Slide-out panel for block prop modifications.
  - `BlockLibraryModal.tsx`: Section template selection dialog.
  - `actions.ts`: Server Action for layout persistence and Next.js revalidation.

- **`src/blocks/RenderBlocks.tsx`**:
  - Automatically hooks into `OverlayVisualBuilderContext` to render dynamic live block states and wrap blocks with `BlockOverlayWrapper`.
