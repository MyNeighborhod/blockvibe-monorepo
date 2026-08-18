import type { Config, Field, Plugin } from "payload"
import type { VisualBuilderPluginConfig } from "./types"
import { defaultPuckBlockDefinitions } from "./config/puckConfig"

export * from "./types"
export * from "./config/puckConfig"

export const visualBuilderPlugin =
  (pluginOptions: VisualBuilderPluginConfig = {}): Plugin =>
  (incomingConfig: Config): Config => {
    const collections = pluginOptions.collections || ["pages"]
    const fieldKey = pluginOptions.fieldKey || "visualBuilderData"

    const updatedCollections = (incomingConfig.collections || []).map((collection) => {
      if (!collections.includes(collection.slug)) {
        return collection
      }

      const visualBuilderField: Field = {
        name: fieldKey,
        type: "json",
        admin: {
          description: "Visual Website Builder layout state (Puck Editor)",
          position: "sidebar",
        },
      }

      return {
        ...collection,
        fields: [...collection.fields, visualBuilderField],
      }
    })

    return {
      ...incomingConfig,
      collections: updatedCollections,
    }
  }

export default visualBuilderPlugin
