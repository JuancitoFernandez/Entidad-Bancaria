"use client"

import { DollarSign, ChevronDown, Check } from "lucide-react"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface CurrencySelectorProps {
  selectedCurrency: string
  onCurrencyChange: (currency: string) => void
}

export default function CurrencySelector({ selectedCurrency, onCurrencyChange }: CurrencySelectorProps) {
  const currencies = [
    { code: "USD", symbol: "$", name: "Dólar", flag: "🇺🇸" },
    { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
    { code: "MXN", symbol: "$", name: "Peso Mexicano", flag: "🇲🇽" },
    { code: "ARS", symbol: "$", name: "Peso Argentino", flag: "🇦🇷" },
    { code: "COP", symbol: "$", name: "Peso Colombiano", flag: "🇨🇴" },
  ]

  const currentCurrency = currencies.find((c) => c.code === selectedCurrency) || currencies[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors border border-border text-foreground hover:text-primary text-sm md:text-base font-medium w-full justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
            <span>{currentCurrency.code}</span>
          </div>
          <ChevronDown className="w-3 h-3 md:w-4 md:h-4 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {currencies.map((currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => onCurrencyChange(currency.code)}
            className="flex items-center justify-between gap-3 cursor-pointer py-2 px-3"
          >
            <div className="flex items-center gap-3 flex-1">
              <span className="text-lg">{currency.flag}</span>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground">{currency.code}</span>
                <span className="text-xs text-muted-foreground">{currency.name}</span>
              </div>
            </div>
            {selectedCurrency === currency.code && <Check className="w-4 h-4 text-primary font-bold" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  MXN: "$",
  ARS: "$",
  COP: "$",
}

export const currencyNames: Record<string, string> = {
  USD: "Dólar",
  EUR: "Euro",
  MXN: "Peso Mexicano",
  ARS: "Peso Argentino",
  COP: "Peso Colombiano",
}

