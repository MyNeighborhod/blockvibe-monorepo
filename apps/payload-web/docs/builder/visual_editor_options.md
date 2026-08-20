# Visual Editor Architectural Options & Alternatives Analysis

This document provides a comprehensive technical breakdown of visual editor architectures, open-source canvas frameworks, turnkey headless visual platforms, and practical non-visual alternatives for content management in BlockVibe.

> **Note:** The canonical version of this document is maintained at [`visual_editor_options.md`](file:///Users/eugen/dev/blockvibe/blockvibe-monorepo/visual_editor_options.md) in the workspace root.

---

## 1. Context & Lessons Learned

Custom visual editor plugins (such as in-context canvas overlays with floating toolbars, slide-out drawers, and drag-and-drop handles) introduce significant complexity:
- **UI & State Overhead:** Managing iframe `postMessage` synchronization, element coordinate tracking, drag-and-drop physics, and slide-out prop inspector drawers.
- **Maintenance & Fragility:** Frequent layout breaks across responsive breakpoints, DOM bloat, and poor editing ergonomics.
- **Key Takeaway:** Building a custom visual editor canvas in-house is non-productive and fragile. Instead of custom visual editor plugins, BlockVibe should choose between **turnkey standard CMS form workflows**, **preset template slotting**, **git/MDX content**, or **off-the-shelf visual CMS platforms**.

---

## 2. Visual Editor Architectures & Evaluated Options

### A. First-Party Native Live Preview (Payload CMS)
* **Model:** Split-Screen Admin Panel + Iframe Preview (`@payloadcms/live-preview-react`).
* **Data Format:** Clean, structured JSON collections and blocks (no layout code or custom styles generated).
* **How it works:** Editors modify structured fields in the CMS sidebar. Changes broadcast in real-time via `postMessage` to the Next.js iframe preview. Standard field annotations (`data-live-preview-path`) allow command-clicking elements in the preview iframe to focus the corresponding sidebar input.

### B. Component Canvas & Open-Source Drag-and-Drop Frameworks
* **Puck (Open Source React Canvas):** Component-first drag-and-drop builder using React and structured JSON schema. Renders React components on a canvas and outputs pure JSON layout trees.
* **Craft.js:** Modular React framework for building custom page builders. Provides state hooks and drag-and-drop primitives (`@dnd-kit`), but requires building all canvas controls, toolbars, and dropzones manually.
* **GrapesJS:** Web builder engine producing HTML/CSS output. Highly flexible visual canvas, but serializes layouts into raw markup and custom CSS strings rather than clean component props.

### C. Off-the-Shelf / Turnkey Headless Visual CMS Platforms
* **Builder.io:** Hosted visual CMS with visual drag-and-drop, visual A/B testing, and native React/Next.js SDKs.
* **Storyblok:** Headless CMS with built-in visual editor, live field linking, and component schema mapping out of the box.
* **Sanity Studio (Presentation Tool):** Visual overlay and live preview mode integrated directly into Sanity's customizing interface.

---

## 3. Options Comparison Matrix

| Option / Architecture | Implementation Type | Data Format | Layout Flexibility | UX & Maintenance Overhead | Output Performance |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Payload Split Live Preview** | Form Sidebar + Iframe | Structured JSON | Medium (Block reordering) | **Very Low** (Native CMS) | **Excellent** |
| **Preset Layout Templates** | Form Slots | Structured JSON | Low-Medium (Controlled) | **Very Low** | **Excellent** |
| **MDX / Git Content** | File-based (`.mdx`) | Markdown + React | High (Code-first) | **Low** (Developer workflow) | **Excellent** |
| **Puck** | Open-Source React Canvas | Component JSON | Medium-High | **Medium** | **Excellent** |
| **Craft.js** | React DnD Framework | Custom JSON tree | High | **High** (Custom UI needed) | **Good** |
| **GrapesJS** | HTML/CSS Visual Canvas | Serialized HTML/CSS | Extremely High | **High** (Style bloat) | **Fair** |
| **Builder.io / Storyblok** | Turnkey Headless Visual CMS | API / Component JSON | High | **Low** (SaaS managed) | **Good** |
| **Custom Canvas Overlay (Attempted)** | Custom Wrapper & Drawers | Payload Collections | High | **Extremely High / Fragile** | **Fair** |

---

## 4. Alternatives to Visual Editors (Non-Visual / Low-Overhead Strategies)

### Strategy 1: Form-First Block Arrays + Split Live Preview (Recommended Default)
* **Concept:** Editors manage an ordered array of structured blocks (*Hero*, *Feature Grid*, *CTA*, *FAQ*, *Contact*) using standard Payload Admin sidebar forms. The live site renders side-by-side in an iframe preview without inline visual overlay controls.
* **Why it wins:** Zero custom visual canvas code to maintain; 100% type-safe JSON; zero DOM bloat; fast & intuitive for content managers.

### Strategy 2: Preset Page Layout Templates & Slotting
* **Concept:** Rather than assembling granular blocks from scratch, editors select top-level page templates (e.g., *"SaaS Product Landing v1"*, *"Community Directory Hub"*, *"Case Study"*). The template exposes dedicated content slots.
* **Why it wins:** Guarantees strict brand design system enforcement, eliminates layout breakage, and speeds up page creation.

### Strategy 3: MDX & Git-Based Content Engines (Fumadocs, Nextra, Contentlayer)
* **Concept:** Pages are authored in `.mdx` files stored in Git or managed via a markdown editor. Interactive React components are embedded directly within the markdown.
* **Why it wins:** Ideal for developer docs, blogs, and marketing pages requiring speed, full version control, and zero CMS infrastructure overhead.

### Strategy 4: Commercial Turnkey Visual CMS Integration
* **Concept:** If non-technical staff demand freeform visual editing, integrate a dedicated visual headless CMS (Builder.io / Storyblok) rather than building a custom canvas plugin.
* **Why it wins:** Offloads canvas maintenance, drag-and-drop handling, and visual controls to a battle-tested third-party platform.

---

## 5. Architectural Recommendation for BlockVibe

1. **Adopt Strategy 1 (Form-First Blocks + Split Live Preview)** as the core content editing strategy in Payload CMS.
2. **Deprecate custom visual overlay wrappers** (`OverlayVisualBuilder`) to eliminate fragile canvas UI code.
3. **Use Page Layout Presets (Strategy 2)** for standardized landing pages and directories.
