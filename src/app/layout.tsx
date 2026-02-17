import React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Toaster } from "sonner"
import { YearProvider } from "@/contexts/year-context"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"] })
const _jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Futbol Manager",
  description:
    "Aplicación para gestionar tu equipo de futbol",
}

export const viewport: Viewport = {
  themeColor: "#1a8a52",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <YearProvider>
          {children}
          <Toaster richColors position="top-right" />
        </YearProvider>
      </body>
    </html>
  )
}
