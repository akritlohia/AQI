"use client"

import "leaflet/dist/leaflet.css"
import { useEffect, useMemo, useState } from "react"

// Remove top-level require usage and load react-leaflet via dynamic import on the client
type RLComponents = {
  MapContainer: any
  TileLayer: any
  CircleMarker: any
  Tooltip: any
}

type LocationPoint = { lat: number; lon: number; avg: number }

type Props = {
  locations: LocationPoint[]
  city: string
  parameter: string
  isLoading?: boolean
}

export default function MapView({ locations, city, parameter, isLoading }: Props) {
  const [rl, setRl] = useState<RLComponents | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      // ESM dynamic import to avoid 'require is not defined'
      const m = await import("react-leaflet")
      if (mounted) {
        setRl({
          MapContainer: m.MapContainer,
          TileLayer: m.TileLayer,
          CircleMarker: m.CircleMarker,
          Tooltip: m.Tooltip,
        })
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const computedCenter = useMemo(() => {
    if (!locations?.length) return null
    const lat = locations.reduce((a, b) => a + b.lat, 0) / locations.length
    const lon = locations.reduce((a, b) => a + b.lon, 0) / locations.length
    return [lat, lon] as [number, number]
  }, [locations])

  if (!rl) {
    return (
      <div className="h-full rounded-md bg-muted flex items-center justify-center text-sm text-muted-foreground">
        Loading map…
      </div>
    )
  }

  const { MapContainer, TileLayer, CircleMarker, Tooltip } = rl

  return (
    <div className="h-full">
      <MapContainer
        center={computedCenter ?? [34.0522, -118.2437]}
        zoom={computedCenter ? 10 : 5}
        className="h-full rounded-md"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> & OpenStreetMap contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {(locations || []).map((loc, idx) => {
          const v = loc.avg
          const color = v < 12 ? "#0d9488" : v < 35 ? "#f59e0b" : "#dc2626"
          const radius = Math.max(6, Math.min(20, Math.sqrt(v) * 2))
          return (
            <CircleMarker
              key={idx}
              center={[loc.lat, loc.lon]}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.6 }}
              radius={radius}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                <div className="text-xs text-slate-200">
                  <div>
                    <strong>{parameter.toUpperCase()}</strong> avg
                  </div>
                  <div>{v.toFixed(1)}</div>
                </div>
              </Tooltip>
            </CircleMarker>
          )
        })}
      </MapContainer>

      {/* Legend */}
      <div
        className="mt-2 inline-flex items-center gap-4 rounded-md border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 backdrop-blur"
        role="region"
        aria-label="AQI legend"
      >
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#0d9488" }}></span> Good
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#f59e0b" }}></span> Moderate
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#dc2626" }}></span> Unhealthy+
        </span>
      </div>

      {isLoading ? (
        <div className="mt-2 text-xs text-slate-200/70">Loading locations…</div>
      ) : locations?.length ? null : (
        <div className="mt-2 text-xs text-slate-200/70">
          No measurement locations found for “{city}”. Try another city.
        </div>
      )}
    </div>
  )
}
