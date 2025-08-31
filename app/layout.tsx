import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Air Quality Monitor & Forecasts | Real‑Time AQI Dashboard",
  description:
    "Track real-time air quality (AQI) with interactive charts and a live map. Explore PM2.5, PM10, NO2, and O3 trends and short‑term forecasts for cities worldwide.",
  keywords: ["air quality", "AQI", "PM2.5", "PM10", "NO2", "O3", "pollution", "map", "forecast", "environment"],
  metadataBase: new URL("https://example.com"),
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Air Quality Monitor & Forecasts",
    description:
      "Real‑time AQI with interactive charts and map overlays plus short‑term forecasts for cities around the world.",
    url: "https://example.com",
    siteName: "Air Quality Monitor",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Air Quality Monitor dashboard preview" }],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Air Quality Monitor & Forecasts",
    description:
      "Real‑time AQI with interactive charts and map overlays plus short‑term forecasts for cities around the world.",
    images: ["/og-image.png"],
    creator: "@your_handle",
  },
} satisfies Metadata

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Air Quality Monitor",
              url: "https://example.com",
              applicationCategory: "Environment",
              operatingSystem: "All",
              description:
                "Real-time AQI dashboard with charts, map overlays, and forecasts for PM2.5, PM10, NO2, and O3.",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-200 antialiased">{children}</body>
    </html>
  )
}
