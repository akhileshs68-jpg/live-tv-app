"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Globe } from "lucide-react"
import { useState, useMemo } from "react"
import type { CountryChannels } from "@/lib/global-channels"

interface CountrySelectorProps {
  countries: CountryChannels[]
  selectedCountry: CountryChannels | null
  onSelectCountry: (country: CountryChannels) => void
}

export function CountrySelector({ countries, selectedCountry, onSelectCountry }: CountrySelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries
    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.code.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [countries, searchQuery])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search countries..."
          className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filteredCountries.map((country) => (
          <Card
            key={country.code}
            className={`p-4 cursor-pointer transition-all border-2 ${
              selectedCountry?.code === country.code
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50 bg-card"
            }`}
            onClick={() => onSelectCountry(country)}
          >
            <div className="text-center space-y-2">
              <div className="text-3xl">{country.emoji}</div>
              <div>
                <p className="font-semibold text-sm text-foreground line-clamp-1">{country.name}</p>
                <Badge variant="outline" className="text-xs mt-1">
                  {country.channels.length} channels
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredCountries.length === 0 && (
        <div className="text-center py-8">
          <Globe className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No countries found</p>
        </div>
      )}
    </div>
  )
}
