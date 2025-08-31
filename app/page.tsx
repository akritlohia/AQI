"use client"

import { useState, useMemo, useEffect } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AQIChart } from "@/components/aqi-chart"
import dynamic from "next/dynamic"
import { computeAQI } from "@/lib/aqi"
import { cn } from "@/lib/utils"

// Dynamic import of MapView to avoid SSR issues
const MapView = dynamic(() => import("@/components/map-view"), { ssr: false })

type SeriesPoint = { time: string; value: number; lat?: number; lon?: number }
type AQIResponse = {
  series: SeriesPoint[]
  latest?: SeriesPoint
  locations: { lat: number; lon: number; avg: number }[]
  parameter: string
  city?: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function Page() {
  const [city, setCity] = useState("Los Angeles")
  const [parameter, setParameter] = useState<"pm25" | "pm10" | "no2" | "o3">("pm25")
  const [hours, setHours] = useState(24)

  // Debounce to avoid firing API on every keystroke
  const [debouncedCity, setDebouncedCity] = useState(city)
  useEffect(() => {
    const id = setTimeout(() => setDebouncedCity(city.trim()), 500)
    return () => clearTimeout(id)
  }, [city])

  const query = useMemo(() => {
    const params = new URLSearchParams({
      city: debouncedCity || "Los Angeles",
      parameter,
      hours: String(hours),
    })
    return `/api/aqi?${params.toString()}`
  }, [debouncedCity, parameter, hours])

  const { data, isLoading, error, mutate } = useSWR<AQIResponse>(query, fetcher, { revalidateOnFocus: false })

  const latestValue = data?.latest?.value
  const latestAQI = latestValue !== undefined ? computeAQI(parameter, latestValue) : undefined

  return (
    <main className="min-h-[100dvh] bg-slate-950 text-slate-200 p-4 md:p-6 lg:p-8">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-pretty text-2xl md:text-3xl font-semibold tracking-tight">Air Quality Dashboard</h1>
          <p className="text-sm text-slate-200/70">
            Real‑time AQI insights from public sources with interactive charts, a live map, and short‑term trends.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {latestAQI !== undefined ? (
            <Badge className={cn("text-white", latestAQI.categoryClass)} aria-live="polite">
              AQI {latestAQI.aqi} • {latestAQI.category}
            </Badge>
          ) : (
            <Badge variant="secondary">No recent data</Badge>
          )}
        </div>
      </header>

      <section className="mt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">City</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Label htmlFor="city" className="sr-only">
                City
              </Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city (e.g., Los Angeles)"
                aria-label="City"
              />
              {/* Quick presets to improve UX */}
              <div className="flex flex-wrap gap-2">
                {["Los Angeles", "Delhi", "Tokyo", "New York", "São Paulo"].map((c) => (
                  <Button key={c} size="sm" variant="outline" onClick={() => setCity(c)}>
                    {c}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pollutant</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="pollutant" className="sr-only">
                Pollutant
              </Label>
              <Select value={parameter} onValueChange={(v) => setParameter(v as any)}>
                <SelectTrigger id="pollutant" aria-label="Pollutant">
                  <SelectValue placeholder="Select pollutant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pm25">PM2.5</SelectItem>
                  <SelectItem value="pm10">PM10</SelectItem>
                  <SelectItem value="no2">NO2</SelectItem>
                  <SelectItem value="o3">O3</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Time Range</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="hours" className="sr-only">
                Hours
              </Label>
              <Select value={String(hours)} onValueChange={(v) => setHours(Number(v))}>
                <SelectTrigger id="hours" aria-label="Hours back">
                  <SelectValue placeholder="Select hours" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">Last 12 hours</SelectItem>
                  <SelectItem value="24">Last 24 hours</SelectItem>
                  <SelectItem value="48">Last 48 hours</SelectItem>
                  <SelectItem value="72">Last 72 hours</SelectItem>
                  <SelectItem value="168">Last 7 days</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white"
                onClick={() => {
                  mutate(undefined, { revalidate: true })
                }}
              >
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCity("Los Angeles")
                  setParameter("pm25")
                  setHours(24)
                }}
              >
                Reset
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Map</CardTitle>
          </CardHeader>
          <CardContent className="h-[360px]">
            <MapView
              locations={data?.locations ?? []}
              city={data?.city ?? city}
              isLoading={isLoading}
              parameter={parameter}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <AQIChart isLoading={isLoading} error={!!error} series={data?.series ?? []} parameter={parameter} />
          </CardContent>
        </Card>
      </section>

      <section className="mt-10 space-y-6" aria-labelledby="about-aqi">
        <h2 id="about-aqi" className="text-xl font-semibold">
          About AQI and this dashboard
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <article className="space-y-2">
            <h3 className="text-lg font-medium">What is AQI?</h3>
            <p className="text-sm leading-relaxed text-slate-200/80">
              The Air Quality Index (AQI) translates concentrations of pollutants such as PM2.5, PM10, NO2, and O3 into
              a simple scale so you can quickly understand health risk. Lower AQI values indicate cleaner air.
              Thresholds are defined by public health agencies and organized into categories like Good, Moderate, and
              Unhealthy.
            </p>
          </article>
          <article className="space-y-2">
            <h3 className="text-lg font-medium">How are the numbers calculated?</h3>
            <p className="text-sm leading-relaxed text-slate-200/80">
              We aggregate recent measurements near your selected city and compute per‑pollutant levels. The time‑series
              shows short‑term trends, and the map highlights relative levels across nearby locations. Data availability
              varies by city and sensor coverage.
            </p>
          </article>
        </div>
      </section>

      <section className="mt-8 space-y-4" aria-labelledby="faq">
        <h2 id="faq" className="text-xl font-semibold">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          <details className="rounded-md border border-white/10 p-3">
            <summary className="cursor-pointer text-sm font-medium">Why do some cities show fewer points?</summary>
            <p className="mt-2 text-sm text-slate-200/80">
              Open data coverage differs by region. If data is sparse or temporarily unavailable, we show what is
              currently reported and provide helpful fallbacks when possible.
            </p>
          </details>
          <details className="rounded-md border border-white/10 p-3">
            <summary className="cursor-pointer text-sm font-medium">What do the colors mean on the map?</summary>
            <p className="mt-2 text-sm text-slate-200/80">
              Teal indicates lower values (better air), amber indicates moderate levels, and red indicates higher values
              that may be less healthy. Colors reflect the selected pollutant.
            </p>
          </details>
          <details className="rounded-md border border-white/10 p-3">
            <summary className="cursor-pointer text-sm font-medium">How often is data refreshed?</summary>
            <p className="mt-2 text-sm text-slate-200/80">
              Sources typically publish measurements hourly or more frequently. Use the Refresh button to re‑query
              recent data for your selection.
            </p>
          </details>
        </div>
      </section>
    </main>
  )
}
