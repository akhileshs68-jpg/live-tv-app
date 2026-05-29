"use client"

import React, { createContext, useContext } from "react"

interface OTTContextType {
  // Future: Add other OTT platforms here (Netflix, Prime Video, etc.)
}

const OTTContext = createContext<OTTContextType | undefined>(undefined)

export function OTTProvider({ children }: { children: React.ReactNode }) {
  return (
    <OTTContext.Provider value={{}}>
      {children}
    </OTTContext.Provider>
  )
}

export function useOTT() {
  const context = useContext(OTTContext)
  if (context === undefined) {
    throw new Error("useOTT must be used within OTTProvider")
  }
  return context
}
