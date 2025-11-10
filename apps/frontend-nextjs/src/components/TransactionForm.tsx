"use client"

import type React from "react"
import { useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { currencySymbols } from "@/components/CurrencySelector"
import { TransactionInitiated } from '@banking-events-system/event-contracts'

interface TransactionFormProps {
  onSubmit: (transaction: TransactionInitiated) => void
  currency: string
  onConnectionStatus?: (connected: boolean) => void
}

export default function TransactionForm({ onSubmit, currency, onConnectionStatus }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    userId: "",
    fromAccount: "",
    toAccount: "",
    amount: "",
    category: "Transferencia",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const symbol = currencySymbols[currency] || "$"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.userId || !formData.fromAccount || !formData.toAccount || !formData.amount) {
      setError("Por favor completa todos los campos requeridos")
      return
    }

    const amountValue = parseFloat(formData.amount)
    if (isNaN(amountValue) || amountValue <= 0) {
      setError("El monto debe ser un número válido mayor a cero")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const transactionData: TransactionInitiated = {
        userId: formData.userId,
        fromAccount: formData.fromAccount,
        toAccount: formData.toAccount,
        amount: amountValue,
        currency: currency,
      }

      await onSubmit(transactionData)
      // Solo limpiar el formulario si la transacción fue exitosa
      setFormData({ userId: "", fromAccount: "", toAccount: "", amount: "", category: "Transferencia" })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error al crear la transacción')
      onConnectionStatus?.(false)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <Card className="border-border h-fit lg:sticky lg:top-6">
      <CardHeader>
        <CardTitle className="text-base">Nueva Transacción</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground block mb-2">ID de Usuario</label>
            <input
              type="text"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              placeholder="user123"
              required
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm md:text-base"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground block mb-2">Cuenta Origen</label>
            <input
              type="text"
              name="fromAccount"
              value={formData.fromAccount}
              onChange={handleChange}
              placeholder="ACC001"
              required
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm md:text-base"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground block mb-2">Cuenta Destino</label>
            <input
              type="text"
              name="toAccount"
              value={formData.toAccount}
              onChange={handleChange}
              placeholder="ACC002"
              required
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm md:text-base"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground block mb-2">Monto</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-muted-foreground">{symbol}</span>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
                className="w-full pl-7 pr-3 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm md:text-base"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground block mb-2">Categoría</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm md:text-base"
            >
              <option value="Transferencia">Transferencia</option>
              <option value="Pago de Servicios">Pago de Servicios</option>
              <option value="Compras">Compras</option>
              <option value="Comida y Bebida">Comida y Bebida</option>
              <option value="Entretenimiento">Entretenimiento</option>
            </select>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm md:text-base"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Procesando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Enviar Dinero
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

