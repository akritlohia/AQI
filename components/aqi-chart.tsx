"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
  Legend,
} from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { useMemo } from "react"

type Props = {
  series: { time: string; value: number }[]
  parameter: "pm25" | "pm10" | "no2" | "o3" | string
  isLoading?: boolean
  error?: boolean
}

function unitFor(param: string) {
  const p = param.toLowerCase()
  return p === "o3" ? "µg/m³" : "µg/m³"
}

function bandsFor(param: string) {
  const p = param.toLowerCase()
  if (p === "pm25") {
    return [
      { y1: 0, y2: 12, fill: "#0d9488", opacity: 0.06, label: "Good" },
      { y1: 12.1, y2: 35.4, fill: "#f59e0b", opacity: 0.06, label: "Moderate" },
      { y1: 35.5, y2: 150.4, fill: "#dc2626", opacity: 0.05, label: "Unhealthy+" },
    ]
  }
  if (p === "pm10") {
    return [
      { y1: 0, y2: 54, fill: "#0d9488", opacity: 0.06, label: "Good" },
      { y1: 55, y2: 154, fill: "#f59e0b", opacity: 0.06, label: "Moderate" },
      { y1: 155, y2: 354, fill: "#dc2626", opacity: 0.05, label: "Unhealthy+" },
    ]
  }
  return []
}

function TooltipContent({ active, payload, label, param }: any) {
  if (!active || !payload?.length) return null
  const v = payload[0].value
  return (
    <div className="rounded-md border border-white/10 bg-slate-950/95 p-2 text-xs text-slate-200 shadow-sm">
      <div className="font-medium">{label}</div>
      <div>
        {param.toUpperCase()}: <strong>{v}</strong> {unitFor(param)}
      </div>
    </div>
  )
}

export function AQIChart({ series, parameter, isLoading, error }: Props) {
  const data = useMemo(() => {
    return (series || []).map((d) => ({
      time: new Date(d.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      value: d.value,
    }))
  }, [series])

  const bands = useMemo(() => bandsFor(parameter), [parameter])

  if (isLoading) {
    return <Skeleton className="h-[260px] w-full" />
  }

  if (error) {
    return <div className="text-sm text-red-600">Failed to load chart data.</div>
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid stroke="rgba(226,232,240,0.12)" strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 12, fill: "#e2e8f0" }} />
          <YAxis tick={{ fontSize: 12, fill: "#e2e8f0" }} />
          {/* AQI bands for context */}
          {bandsFor(parameter).map((b, i) => (
            <ReferenceLine key={i} y={b.y2} stroke={b.fill} strokeOpacity={0.15} ifOverflow="extendDomain" />
          ))}
          <Tooltip content={<TooltipContent param={parameter} />} cursor={{ stroke: "rgba(226,232,240,0.35)" }} />
          <Legend />
          <ReferenceLine y={0} stroke="rgba(226,232,240,0.2)" />
          <Line
            type="monotone"
            dataKey="value"
            name={parameter.toUpperCase()}
            stroke="#0d9488"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 text-xs text-slate-200/70">
        Parameter: {parameter.toUpperCase()} • Units: {unitFor(parameter)}
      </div>
    </div>
  )
}
