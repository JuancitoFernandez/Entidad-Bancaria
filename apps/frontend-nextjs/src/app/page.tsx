"use client"

import { useState, useEffect, useCallback } from "react"
import DashboardHeader from "@/components/DashboardHeader"
import AccountOverview from "@/components/AccountOverview"
import TransactionForm from "@/components/TransactionForm"
import ActivityTimeline from "@/components/ActivityTimeline"
import TransactionTimeline from "@/components/TransactionTimeline"
import MarketTicker from "@/components/MarketTicker"
import CurrencyConverter from "@/components/CurrencyConverter"
import DollarRatesArgentina from "@/components/DollarRatesArgentina"
import { EventEnvelope, TransactionInitiated } from '@banking-events-system/event-contracts'

export default function DashboardPage() {
  const [darkMode, setDarkMode] = useState(true)
  const [events, setEvents] = useState<EventEnvelope[]>([])
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [currency, setCurrency] = useState("USD")
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleNewTransaction = useCallback(async (transaction: TransactionInitiated) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error: ${response.statusText}`)
      }

      const data = await response.json()
      setCurrentTransactionId(data.transactionId)
      setEvents([]) // Reset events for new transaction
      setSuccessMessage(`Transacción creada exitosamente: ${data.transactionId}`)
      
      // Limpiar mensaje de éxito después de 5 segundos
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err) {
      console.error('Error creating transaction:', err)
      setIsConnected(false)
      throw err // Re-lanzar para que TransactionForm pueda manejarlo
    }
  }, [])

  const handleEventReceived = useCallback((event: EventEnvelope) => {
    setEvents((prevEvents) => {
      // Evitar duplicados
      const exists = prevEvents.some(e => e.id === event.id && e.type === event.type)
      if (exists) return prevEvents
      return [...prevEvents, event]
    })
  }, [])

  const handleConnectionStatus = useCallback((connected: boolean) => {
    setIsConnected(connected)
  }, [])

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-background text-foreground">
        <DashboardHeader darkMode={darkMode} setDarkMode={setDarkMode} currency={currency} setCurrency={setCurrency} />

        <main className="px-4 py-6 md:p-6 max-w-7xl mx-auto w-full">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              {successMessage}
            </div>
          )}

          {/* Account & Transaction Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="lg:col-span-2">
              <AccountOverview currency={currency} />
            </div>
            <div className="w-full">
              <TransactionForm 
                onSubmit={handleNewTransaction} 
                currency={currency}
                onConnectionStatus={handleConnectionStatus}
              />
            </div>
          </div>

          {/* Market Ticker & Currency Converter */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="lg:col-span-2">
              <MarketTicker currency={currency} />
            </div>
            <div className="w-full">
              <CurrencyConverter />
            </div>
          </div>

          {/* Dollar Rates Argentina */}
          <div className="mb-6 md:mb-8">
            <DollarRatesArgentina />
          </div>

          {/* Transaction Timeline */}
          {currentTransactionId && (
            <div className="mb-6 md:mb-8">
              <div className="bg-card border border-border rounded-lg p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base md:text-lg font-semibold">Historial de Transacciones en Tiempo Real</h2>
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
                    />
                    <span className="text-xs md:text-sm" style={{ color: isConnected ? '#10b981' : '#ef4444' }}>
                      {isConnected ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>
                </div>
                <div className="mb-2 text-xs text-muted-foreground">
                  Transaction ID: {currentTransactionId}
                </div>
                <TransactionTimeline
                  transactionId={currentTransactionId}
                  events={events}
                  onEventReceived={handleEventReceived}
                  onConnectionStatus={handleConnectionStatus}
                />
              </div>
            </div>
          )}

          {/* Activity Timeline - Shows all events */}
          {events.length > 0 && (
            <ActivityTimeline activities={events} currency={currency} />
          )}
        </main>
      </div>
    </div>
  )
}
