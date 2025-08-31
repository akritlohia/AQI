import { type NextRequest, NextResponse } from "next/server"

const OPENAQ_URL = "https://api.openaq.org/v2/measurements"

// Geocode a city name to {lat, lon} using Open-Meteo (no API key)
async function geocodeCity(name: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`
    const res = await fetch(geoUrl, { cache: "no-store", next: { revalidate: 0 } })
    if (!res.ok) return null
    const json = await res.json()
    const p = json?.results?.[0]
    if (p && typeof p.latitude === "number" && typeof p.longitude === "number") {
      return { lat: p.latitude, lon: p.longitude }
    }
  } catch (e: any) {
    console.log("[v0] geocode error:", e?.message)
  }
  return null
}

type OpenAQMeasurement = {
  value: number
  unit: string
  date: { utc: string; local: string }
  coordinates?: { latitude: number; longitude: number }
  parameter: string
  city?: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const rawCity = searchParams.get("city") || "Los Angeles"
  const parameterRaw = (searchParams.get("parameter") || "pm25").toLowerCase()
  const hours = Math.min(Math.max(Number(searchParams.get("hours") || "24"), 1), 168)

  const allowed = new Set(["pm25", "pm10", "no2", "o3"])
  const parameter = allowed.has(parameterRaw) ? parameterRaw : "pm25"

  const date_to = new Date()
  const date_from = new Date(date_to.getTime() - hours * 60 * 60 * 1000)

  const geo = await geocodeCity(rawCity)
  const center = geo ?? { lat: 34.0522, lon: -118.2437 }
  const radiusMeters = 50000 // 50 km search radius

  // Query OpenAQ by coordinates+radius (more reliable than strict city matching)
  const qs = new URLSearchParams({
    coordinates: `${center.lat},${center.lon}`,
    radius: String(radiusMeters),
    parameter,
    date_from: date_from.toISOString(),
    date_to: date_to.toISOString(),
    limit: "1000",
    sort: "asc",
    order_by: "datetime",
  })
  const url = `${OPENAQ_URL}?${qs.toString()}`
  console.log("[v0] /api/aqi request:", {
    city: rawCity,
    parameter,
    hours,
    url,
    center,
    radiusMeters,
  })

  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      cache: "no-store",
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      console.log("[v0] OpenAQ non-OK:", res.status)
      const fallback = makeFallback(rawCity, parameter, hours, center)
      return NextResponse.json({ ...fallback, parameter, city: rawCity, center, source: "mock-nonok" }, { status: 200 })
    }

    const json = await res.json()
    const results: OpenAQMeasurement[] = (json?.results || []).filter(
      (r: any) => typeof r?.value === "number" && !Number.isNaN(r.value),
    )

    // Normalize timeseries
    const series = results.map((r) => ({
      time: r.date.utc,
      value: r.value,
      lat: r.coordinates?.latitude,
      lon: r.coordinates?.longitude,
    }))

    // Aggregate by location for map markers
    const locationMap = new Map<string, { sum: number; count: number; lat: number; lon: number }>()
    for (const r of results) {
      if (r.coordinates?.latitude != null && r.coordinates?.longitude != null) {
        const key = `${r.coordinates.latitude.toFixed(4)},${r.coordinates.longitude.toFixed(4)}`
        const entry = locationMap.get(key) || {
          sum: 0,
          count: 0,
          lat: r.coordinates.latitude,
          lon: r.coordinates.longitude,
        }
        entry.sum += r.value
        entry.count += 1
        locationMap.set(key, entry)
      }
    }
    const locations = Array.from(locationMap.values()).map((e) => ({
      lat: e.lat,
      lon: e.lon,
      avg: e.count ? e.sum / e.count : 0,
    }))

    if (!series.length) {
      console.log("[v0] OpenAQ empty results; using fallback")
      const fb = makeFallback(rawCity, parameter, hours, center)
      return NextResponse.json({ ...fb, parameter, city: rawCity, center, source: "mock-empty" }, { status: 200 })
    }

    const latest = series[series.length - 1]
    return NextResponse.json({ series, latest, locations, parameter, city: rawCity, center, source: "openaq" })
  } catch (e: any) {
    console.log("[v0] OpenAQ exception:", e?.message)
    const fallback = makeFallback(rawCity, parameter, hours, center)
    return NextResponse.json(
      { ...fallback, parameter, city: rawCity, center, source: "mock-exception" },
      { status: 200 },
    )
  }
}

function makeFallback(
  city: string,
  parameter: string,
  hours: number,
  center: { lat: number; lon: number } = { lat: 34.0522, lon: -118.2437 },
) {
  const now = new Date()
  const series: { time: string; value: number }[] = []
  const base = parameter.toLowerCase() === "pm25" ? 22 : parameter.toLowerCase() === "pm10" ? 35 : 18
  for (let i = hours - 1; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 60 * 60 * 1000)
    const noise = Math.sin(i / 3) * 4 + (Math.random() - 0.5) * 2
    const value = Math.max(0, base + noise)
    series.push({ time: t.toISOString(), value: Number(value.toFixed(1)) })
  }
  const jitter = (n: number) => (Math.random() - 0.5) * n
  const locations = [
    { lat: center.lat + jitter(0.05), lon: center.lon + jitter(0.05), avg: Number((base + 2).toFixed(1)) },
    { lat: center.lat + jitter(0.1), lon: center.lon + jitter(0.1), avg: Number((base + 5).toFixed(1)) },
  ]
  const latest = series[series.length - 1]
  return { series, latest, locations }
}
