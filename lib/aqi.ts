type AQIResult = { aqi: number; category: string; categoryClass: string }

export function computeAQI(parameter: string, value: number): AQIResult {
  const p = parameter.toLowerCase()
  if (p === "pm25") {
    return mapToAQI(value, PM25_BREAKPOINTS)
  }
  if (p === "pm10") {
    return mapToAQI(value, PM10_BREAKPOINTS)
  }
  if (p === "o3") {
    // Using 8-hr O3 ppm equivalents rough mapping (value as µg/m3 -> approx ppm proxy)
    return mapToAQI(value, O3_BREAKPOINTS)
  }
  if (p === "no2") {
    return mapToAQI(value, NO2_BREAKPOINTS)
  }
  // Default: treat like PM2.5
  return mapToAQI(value, PM25_BREAKPOINTS)
}

type Breakpoint = {
  cLow: number
  cHigh: number
  iLow: number
  iHigh: number
  category: string
  className: string
}

const PM25_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50, category: "Good", className: "bg-teal-600" },
  { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100, category: "Moderate", className: "bg-amber-500" },
  { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150, category: "Unhealthy for Sensitive", className: "bg-amber-600" },
  { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200, category: "Unhealthy", className: "bg-red-600" },
  { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300, category: "Very Unhealthy", className: "bg-red-700" },
  { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500, category: "Hazardous", className: "bg-red-800" },
]

const PM10_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50, category: "Good", className: "bg-teal-600" },
  { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100, category: "Moderate", className: "bg-amber-500" },
  { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150, category: "Unhealthy for Sensitive", className: "bg-amber-600" },
  { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200, category: "Unhealthy", className: "bg-red-600" },
  { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300, category: "Very Unhealthy", className: "bg-red-700" },
  { cLow: 425, cHigh: 604, iLow: 301, iHigh: 500, category: "Hazardous", className: "bg-red-800" },
]

// Simplified; real O3 uses ppm and different averaging
const O3_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 100, iLow: 0, iHigh: 50, category: "Good", className: "bg-teal-600" },
  { cLow: 101, cHigh: 160, iLow: 51, iHigh: 100, category: "Moderate", className: "bg-amber-500" },
  { cLow: 161, cHigh: 214, iLow: 101, iHigh: 150, category: "Unhealthy for Sensitive", className: "bg-amber-600" },
  { cLow: 215, cHigh: 404, iLow: 151, iHigh: 200, category: "Unhealthy", className: "bg-red-600" },
  { cLow: 405, cHigh: 504, iLow: 201, iHigh: 300, category: "Very Unhealthy", className: "bg-red-700" },
  { cLow: 505, cHigh: 604, iLow: 301, iHigh: 500, category: "Hazardous", className: "bg-red-800" },
]

// Simplified NO2 (µg/m3) mapping
const NO2_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50, category: "Good", className: "bg-teal-600" },
  { cLow: 41, cHigh: 90, iLow: 51, iHigh: 100, category: "Moderate", className: "bg-amber-500" },
  { cLow: 91, cHigh: 120, iLow: 101, iHigh: 150, category: "Unhealthy for Sensitive", className: "bg-amber-600" },
  { cLow: 121, cHigh: 230, iLow: 151, iHigh: 200, category: "Unhealthy", className: "bg-red-600" },
  { cLow: 231, cHigh: 340, iLow: 201, iHigh: 300, category: "Very Unhealthy", className: "bg-red-700" },
  { cLow: 341, cHigh: 1000, iLow: 301, iHigh: 500, category: "Hazardous", className: "bg-red-800" },
]

export function mapToAQI(value: number, table: Breakpoint[]): AQIResult {
  for (const bp of table) {
    if (value >= bp.cLow && value <= bp.cHigh) {
      const aqi = Math.round(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (value - bp.cLow) + bp.iLow)
      return { aqi, category: bp.category, categoryClass: bp.className }
    }
  }
  const tail = table[table.length - 1]
  // Above table: clamp to max
  return { aqi: tail.iHigh, category: tail.category, categoryClass: tail.className }
}
