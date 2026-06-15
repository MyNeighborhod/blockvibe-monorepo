# Page Structure and Building Blocks Reference

This document outlines the collections, hero configurations, and layout blocks available for constructing pages in BlockVibe. Administrators and editors can use these components to build custom, responsive pages within the Admin panel.

---

## 1. Page Collection Structure

Each document in the **Pages** collection represents a route on the website. Pages are tenant-scoped and contain three main sections:

1. **Hero**: Renders at the top of the page (below the navigation bar).
2. **Content Layout**: An array of sequential building blocks that make up the page body.
3. **SEO**: Fields for custom metadata (Meta Title, Description, Image) used for search engine optimization.

---

## 2. Hero Configurations

The hero section defines the introductory block at the very top of a page. There are four types of heroes available:

| Hero Type | Admin Option | Required Fields | Renders As |
| :--- | :--- | :--- | :--- |
| **None** | `None` | *None* | No hero section is rendered. |
| **Low Impact** | `Low Impact` | Rich Text, Links | A simple, centered text introduction with optional action buttons. |
| **Medium Impact** | `Medium Impact` | Rich Text, Links, Media | A side-by-side or split layout with text on one side and a media element (image/video) on the other. |
| **High Impact** | `High Impact` | Rich Text, Links, Media | A full-width banner block with a background image/video and overlaid content. |

---

## 3. Page Layout Blocks

Layout blocks are modular content components that can be added, reordered, or removed within the Page content tab.

### 1. Content Block (`content`)
The most flexible layout block. It allows grid layouts of up to 4 columns.
- **Fields**:
  - `columns` (Array):
    - `type` (Select): `Text` or `Media`
    - `size` (Select): `One Third`, `Half`, `Two Thirds`, `Full`
    - `richText` (Rich Text): Rich text content using the Lexical editor (visible if type is `Text`).
    - `media` (Upload): Uploaded image/video file from the Media library (visible if type is `Media`).
    - `enableLink` (Checkbox): Enables linking the column to a URL or page.
    - `link` (Group): Custom URL or Page reference with optional label and target.

### 2. Call to Action Block (`cta`)
A prominent banner section designed to grab attention and direct users to a specific link.
- **Fields**:
  - `richText` (Rich Text): Callout header and supporting text.
  - `links` (Array): Up to 2 buttons with custom styles (e.g., solid, outline).

### 3. Media Block (`mediaBlock`)
Renders a single piece of media (image or video) at full-width or centered container width.
- **Fields**:
  - `media` (Upload): Reference to a file in the Media collection.

### 4. Archive Block (`archive`)
Dynamically fetches and lists content from other collections (e.g. blog posts).
- **Fields**:
  - `introContent` (Rich Text): Text introduction above the archive list.
  - `populateBy` (Select):
    - `Collection`: Automatically populates posts.
    - `Individual Selection`: Manually pick specific posts.
  - `relationTo` (Select): Currently defaults to `posts`.
  - `categories` (Relationship): Filter the populated posts by specific Categories.
  - `limit` (Number): Number of items to display (default 10).
  - `selectedDocs` (Relationship): Hand-selected posts (used when `populateBy` is `selection`).

### 5. Form Block (`formBlock`)
Integrates interactive forms created with the Payload Form Builder.
- **Fields**:
  - `form` (Relationship): Reference to a form in the Forms collection.
  - `enableIntro` (Checkbox): Toggle display of introductory content.
  - `introContent` (Rich Text): Optional introductory text displayed above the form.

### 6. Tenant Request Form Block (`tenantRequestForm`) [New / Special]
A dedicated block to render the platform signup and space request form with built-in mathematical captcha verification.
- **Fields**:
  - `title` (Text): Heading for the request form (default: "Request a BlockVibe Space").
  - `description` (Text): Subheading explaining the request details.
