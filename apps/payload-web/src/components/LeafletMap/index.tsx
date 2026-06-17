"use client"
import React, { useEffect, useRef } from "react"

export type LeafletMapProps = {
  latitude: number
  longitude: number
  zoom: number
  boundaryGeoJSON?: string | null
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  latitude,
  longitude,
  zoom,
  boundaryGeoJSON,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    const container = mapContainerRef.current
    // Avoid running on server-side or if container is not ready
    if (typeof window === "undefined" || !container) return

    // Import Leaflet dynamically on the client side
    import("leaflet").then((leaflet) => {
      // Fix leaflet marker icon paths for Next.js bundler
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      })

      // Clean up previous map instance if it exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      // Create new Leaflet Map instance
      const map = leaflet.map(container).setView([latitude, longitude], zoom)
      mapInstanceRef.current = map

      // Load OpenStreetMap tiles
      leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)

      // Add a marker at the center
      leaflet.marker([latitude, longitude]).addTo(map)

      // Parse and add GeoJSON boundary layer if provided
      if (boundaryGeoJSON) {
        try {
          const parsedGeoJSON = JSON.parse(boundaryGeoJSON)
          leaflet.geoJSON(parsedGeoJSON, {
            style: {
              color: "#ef4444", // Red border (matching Weebly contact style)
              dashArray: "5, 5", // Dashed lines
              fillColor: "#ef4444", // Transparent red shading
              fillOpacity: 0.1,
              weight: 2.5,
            },
          }).addTo(map)
        } catch (e) {
          console.error("LeafletMap: Failed to parse boundaryGeoJSON:", e)
        }
      }
    })

    return () => {
      // Cleanup map instance on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [latitude, longitude, zoom, boundaryGeoJSON])

  return (
    <div className="relative w-full h-[350px] lg:h-[450px] rounded-[0.8rem] overflow-hidden border border-border shadow-sm">
      <div ref={mapContainerRef} className="w-full h-full z-10" />
    </div>
  )
}

export default LeafletMap
