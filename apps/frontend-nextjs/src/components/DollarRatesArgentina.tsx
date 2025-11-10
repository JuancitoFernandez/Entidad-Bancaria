"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, RefreshCw, Loader2, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface DollarRate {
  id: string
  name: string
  buy: number
  sell: number
  variation: number
  lastUpdate: string
  description: string
}

interface DolarSiResponse {
  casa: {
    nombre: string
    compra: string
    venta: string
    variacion?: string
    fechaActualizacion?: string
  }
}

export default function DollarRatesArgentina() {
  const [rates, setRates] = useState<DollarRate[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchDollarRates = async () => {
    setLoading(true)
    setError(null)

    try {
      // API real de dolarsi.com para cotizaciones del dólar en Argentina
      const response = await fetch("https://www.dolarsi.com/api/api.php?type=valoresprincipales")
      
      if (!response.ok) {
        throw new Error("Error al obtener cotizaciones")
      }

      const data: DolarSiResponse[] = await response.json()

      // Mapear los datos de la API a nuestro formato
      const mappedRates: DollarRate[] = data
        .filter((item) => {
          // Filtrar solo los tipos de dólar relevantes
          const name = item.casa.nombre.toLowerCase()
          return (
            name.includes("dolar") ||
            name.includes("blue") ||
            name.includes("mep") ||
            name.includes("ccl") ||
            name.includes("tarjeta") ||
            name.includes("mayorista") ||
            name.includes("oficial")
          )
        })
        .map((item) => {
          const casa = item.casa
          const buy = parseFloat(casa.compra.replace(",", ".")) || 0
          const sell = parseFloat(casa.venta.replace(",", ".")) || 0
          const variation = parseFloat(casa.variacion?.replace(",", ".") || "0") || 0

          // Mapear nombres a descripciones más claras
          const nameMap: Record<string, { name: string; description: string }> = {
            "dolar oficial": { name: "Dólar Oficial", description: "Tipo de cambio oficial del Banco Central" },
            "dolar blue": { name: "Dólar Blue", description: "Cotización del mercado paralelo" },
            "dolar mep": { name: "Dólar MEP", description: "Mercado Electrónico de Pagos" },
            "dolar ccl": { name: "Dólar CCL", description: "Contado con Liquidación" },
            "dolar tarjeta": { name: "Dólar Tarjeta", description: "Para compras con tarjeta de crédito" },
            "dolar mayorista": { name: "Dólar Mayorista", description: "Para operaciones bancarias" },
            "dolar bolsa": { name: "Dólar Bolsa", description: "Cotización en el mercado de valores" },
            "dolar solidario": { name: "Dólar Solidario", description: "Con impuesto país y ganancias" },
          }

          const normalizedName = casa.nombre.toLowerCase()
          const mapped = Object.entries(nameMap).find(([key]) => normalizedName.includes(key))
          const displayInfo = mapped ? nameMap[mapped[0]] : { name: casa.nombre, description: "Cotización del dólar" }

          return {
            id: normalizedName.replace(/\s+/g, "-"),
            name: displayInfo.name,
            buy,
            sell,
            variation,
            lastUpdate: casa.fechaActualizacion || "Actualizado ahora",
            description: displayInfo.description,
          }
        })
        .filter((rate) => rate.buy > 0 || rate.sell > 0) // Filtrar tasas inválidas

      // Si no hay datos, usar datos de respaldo
      if (mappedRates.length === 0) {
        throw new Error("No se pudieron obtener cotizaciones")
      }

      setRates(mappedRates)
      setLastUpdate(new Date())
    } catch (err) {
      console.error("Error fetching dollar rates:", err)
      setError("Error al cargar las cotizaciones. Usando datos de respaldo.")
      
      // Datos de respaldo en caso de error
      const fallbackRates: DollarRate[] = [
        {
          id: "oficial",
          name: "Dólar Oficial",
          buy: 350,
          sell: 360,
          variation: 0.5,
          lastUpdate: "Datos de respaldo",
          description: "Tipo de cambio oficial del Banco Central",
        },
        {
          id: "blue",
          name: "Dólar Blue",
          buy: 1020,
          sell: 1040,
          variation: -1.2,
          lastUpdate: "Datos de respaldo",
          description: "Cotización del mercado paralelo",
        },
      ]
      setRates(fallbackRates)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDollarRates()

    // Actualizar cada 30 segundos
    const interval = setInterval(fetchDollarRates, 30000)

    return () => clearInterval(interval)
  }, [])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base md:text-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            <span>Cotización del Dólar en Argentina</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">En vivo</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={fetchDollarRates}
              disabled={loading}
              className="h-8 w-8"
              title="Actualizar cotizaciones"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardTitle>
        {lastUpdate && (
          <p className="text-xs text-muted-foreground mt-1">
            Última actualización: {formatDate(lastUpdate)}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
            {error}
          </div>
        )}

        {loading && rates.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Cargando cotizaciones...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rates.map((rate) => (
              <div
                key={rate.id}
                className="p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground text-sm md:text-base">
                        {rate.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">{rate.description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {rate.variation >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          rate.variation >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {rate.variation >= 0 ? "+" : ""}
                        {rate.variation.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Rates */}
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    {rate.buy > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Compra:</span>
                        <span className="text-sm font-semibold text-foreground">
                          {formatCurrency(rate.buy)}
                        </span>
                      </div>
                    )}
                    {rate.sell > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Venta:</span>
                        <span className="text-sm font-semibold text-primary">
                          {formatCurrency(rate.sell)}
                        </span>
                      </div>
                    )}
                    {rate.buy > 0 && rate.sell > 0 && (
                      <div className="flex items-center justify-between pt-1 border-t border-border/30">
                        <span className="text-xs text-muted-foreground">Spread:</span>
                        <span className="text-xs font-medium text-muted-foreground">
                          {formatCurrency(rate.sell - rate.buy)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
