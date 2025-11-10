"use client"

import { ArrowUpRight, ArrowDownLeft, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { currencySymbols } from "@/components/CurrencySelector"

interface AccountOverviewProps {
  currency: string
}

export default function AccountOverview({ currency }: AccountOverviewProps) {
  const symbol = currencySymbols[currency] || "$"

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary/20 to-accent/10 border-border">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Saldo Total</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 md:space-y-4">
          <div className="text-2xl md:text-4xl font-bold text-foreground">{symbol}24,582.50</div>
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-primary" />
            <span className="text-muted-foreground">+12.5% respecto al mes anterior</span>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <Card className="border-border">
          <CardContent className="pt-4 md:pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                </div>
                <span className="text-xs md:text-sm text-muted-foreground">Ingresos</span>
              </div>
              <div className="text-lg md:text-2xl font-bold text-foreground">{symbol}8,500</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-4 md:pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <ArrowDownLeft className="w-4 h-4 md:w-5 md:h-5 text-destructive" />
                </div>
                <span className="text-xs md:text-sm text-muted-foreground">Gastos</span>
              </div>
              <div className="text-lg md:text-2xl font-bold text-foreground">{symbol}3,250</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Accounts */}
      <Card className="border-border">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="text-sm md:text-base">Cuentas Conectadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 md:space-y-3">
            {["Cuenta Corriente", "Cuenta de Ahorros", "Cuenta de Inversión"].map((account) => (
              <div key={account} className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-secondary/50">
                <span className="text-xs md:text-sm text-foreground">{account}</span>
                <span className="text-xs md:text-sm text-muted-foreground">Vinculada</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}




