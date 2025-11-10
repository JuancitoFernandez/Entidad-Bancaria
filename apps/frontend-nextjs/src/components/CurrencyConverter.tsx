"use client"

import { useState, useEffect } from "react"
import { ArrowLeftRight, Calculator, Loader2, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { currencySymbols, currencyNames } from "@/components/CurrencySelector"

interface ExchangeRates {
  [key: string]: number
}

export default function CurrencyConverter() {
  const [fromCurrency, setFromCurrency] = useState("USD")
  const [toCurrency, setToCurrency] = useState("MXN")
  const [amount, setAmount] = useState("1")
  const [convertedAmount, setConvertedAmount] = useState("")
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)
  const [rates, setRates] = useState<ExchangeRates | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Cargar tasas de cambio reales
  useEffect(() => {
    const fetchExchangeRates = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Usar exchangerate.host (API gratuita, sin API key)
        const response = await fetch(`https://api.exchangerate.host/latest?base=${fromCurrency}`)
        
        if (!response.ok) {
          throw new Error('Error al obtener tasas de cambio')
        }
        
        const data = await response.json()
        
        if (data.success && data.rates) {
          setRates(data.rates)
          setLastUpdate(new Date())
        } else {
          throw new Error('Datos de tasas inválidos')
        }
      } catch (err) {
        console.error('Error fetching exchange rates:', err)
        setError('No se pudieron cargar las tasas de cambio. Intenta nuevamente.')
        // Usar tasas de respaldo si falla la API
        setRates({
          USD: 1,
          EUR: 0.92,
          MXN: 17.5,
          ARS: 850,
          COP: 3900,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchExchangeRates()
    
    // Actualizar tasas cada 5 minutos
    const interval = setInterval(fetchExchangeRates, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [fromCurrency])

  // Calcular tasa de cambio cuando cambian las monedas o se cargan las tasas
  useEffect(() => {
    if (!rates) return

    if (fromCurrency === toCurrency) {
      setExchangeRate(1)
      return
    }

    // Obtener tasa directa desde la API
    const rate = rates[toCurrency]
    if (rate) {
      setExchangeRate(rate)
    } else {
      setExchangeRate(null)
    }
  }, [fromCurrency, toCurrency, rates])

  // Calcular monto convertido
  useEffect(() => {
    if (amount && exchangeRate) {
      const numAmount = parseFloat(amount)
      if (!isNaN(numAmount) && numAmount >= 0) {
        const converted = numAmount * exchangeRate
        setConvertedAmount(converted.toFixed(2))
      } else {
        setConvertedAmount("")
      }
    } else {
      setConvertedAmount("")
    }
  }, [amount, exchangeRate])

  const handleSwap = () => {
    const temp = fromCurrency
    setFromCurrency(toCurrency)
    setToCurrency(temp)
    // No limpiar el monto, solo intercambiar
  }

  const handleRefresh = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`https://api.exchangerate.host/latest?base=${fromCurrency}`)
      
      if (!response.ok) {
        throw new Error('Error al actualizar tasas')
      }
      
      const data = await response.json()
      
      if (data.success && data.rates) {
        setRates(data.rates)
        setLastUpdate(new Date())
      }
    } catch (err) {
      console.error('Error refreshing rates:', err)
      setError('Error al actualizar. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date)
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base md:text-lg">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            <span>Calculadora de Divisas</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
            className="h-8 w-8"
            title="Actualizar tasas"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
            {error}
          </div>
        )}

        {loading && !rates && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Cargando tasas...</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">De</label>
          <div className="flex gap-2 relative">
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              disabled={loading}
              className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm md:text-base disabled:opacity-50"
            >
              {Object.keys(currencySymbols).map((code) => (
                <option key={code} value={code}>
                  {code} - {currencyNames[code]}
                </option>
              ))}
            </select>
            <div className="flex-1 relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm md:text-base"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleSwap}
            className="rounded-full"
            disabled={loading}
          >
            <ArrowLeftRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">A</label>
          <div className="flex gap-2 relative">
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              disabled={loading}
              className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm md:text-base disabled:opacity-50"
            >
              {Object.keys(currencySymbols).map((code) => (
                <option key={code} value={code}>
                  {code} - {currencyNames[code]}
                </option>
              ))}
            </select>
            <div className="flex-1 relative">
              <input
                type="text"
                value={convertedAmount ? `${currencySymbols[toCurrency]} ${convertedAmount}` : ""}
                readOnly
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder-muted-foreground text-sm md:text-base font-semibold cursor-default"
              />
            </div>
          </div>
        </div>

        {exchangeRate && exchangeRate !== 1 && (
          <div className="pt-2 border-t border-border space-y-1">
            <p className="text-xs text-muted-foreground text-center">
              Tasa de cambio: <span className="font-semibold text-foreground">1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}</span>
            </p>
            {lastUpdate && (
              <p className="text-xs text-muted-foreground/70 text-center">
                Actualizado: {formatDate(lastUpdate)}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
