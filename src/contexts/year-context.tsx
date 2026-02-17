"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface YearContextType {
  selectedYear: number | null
  setSelectedYear: (year: number | null) => void
  availableYears: number[]
  setAvailableYears: (years: number[]) => void
}

const YearContext = createContext<YearContextType | undefined>(undefined)

export function YearProvider({ children }: { children: React.ReactNode }) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [availableYears, setAvailableYears] = useState<number[]>([])

  // Por defecto, seleccionar el año más reciente cuando haya años disponibles
  useEffect(() => {
    if (availableYears.length > 0 && selectedYear === null) {
      setSelectedYear(availableYears[0])
    }
  }, [availableYears, selectedYear])

  return (
    <YearContext.Provider
      value={{
        selectedYear,
        setSelectedYear,
        availableYears,
        setAvailableYears,
      }}
    >
      {children}
    </YearContext.Provider>
  )
}

export function useYear() {
  const context = useContext(YearContext)
  if (context === undefined) {
    throw new Error("useYear must be used within a YearProvider")
  }
  return context
}
