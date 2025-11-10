"use client"

import { Moon, Sun, Bell, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import CurrencySelector from "@/components/CurrencySelector"

interface DashboardHeaderProps {
  darkMode: boolean
  setDarkMode: (value: boolean) => void
  currency: string
  setCurrency: (currency: string) => void
}

export default function DashboardHeader({ darkMode, setDarkMode, currency, setCurrency }: DashboardHeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="p-4 md:p-6 max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            B
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-foreground">Banking Events System</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Sistema de transacciones bancarias en tiempo real</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
          <CurrencySelector selectedCurrency={currency} onCurrencyChange={setCurrency} />

          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Settings className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
            className="text-muted-foreground hover:text-foreground"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </header>
  )
}




