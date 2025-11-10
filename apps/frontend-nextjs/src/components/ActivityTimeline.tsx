"use client"

import { ArrowUpRight, ArrowDownLeft, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { currencySymbols } from "@/components/CurrencySelector"
import { EventEnvelope } from '@banking-events-system/event-contracts'

interface ActivityTimelineProps {
  activities: EventEnvelope[]
  currency: string
}

export default function ActivityTimeline({ activities, currency }: ActivityTimelineProps) {
  const symbol = currencySymbols[currency] || "$"

  const getActivityIcon = (type: string) => {
    if (type.includes('Committed') || type.includes('FundsReserved')) {
      return <Download className="w-5 h-5" />
    }
    return <ArrowUpRight className="w-5 h-5" />
  }

  const formatTime = (timestamp: number) => {
    const now = new Date()
    const date = new Date(timestamp)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Justo ahora"
    if (diffMins < 60) return `hace ${diffMins}m`
    if (diffHours < 24) return `hace ${diffHours}h`
    if (diffDays < 7) return `hace ${diffDays}d`
    return date.toLocaleDateString("es-ES")
  }

  const getEventDisplayName = (type: string) => {
    const eventNames: Record<string, string> = {
      'txn.FundsReserved': 'Reserva de Fondos',
      'txn.FraudChecked': 'Verificación de Fraude',
      'txn.Committed': 'Transacción Confirmada',
      'txn.Reversed': 'Transacción Revertida',
      'txn.Notified': 'Notificación Enviada',
    }
    return eventNames[type] || type
  }

  const getCategoryColor = (type: string) => {
    const colors: Record<string, string> = {
      'txn.FundsReserved': "bg-primary/10 text-primary",
      'txn.FraudChecked': "bg-orange-500/10 text-orange-400",
      'txn.Committed': "bg-green-500/10 text-green-400",
      'txn.Reversed': "bg-destructive/10 text-destructive",
      'txn.Notified': "bg-blue-500/10 text-blue-400",
    }
    return colors[type] || "bg-muted text-muted-foreground"
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3 md:pb-6">
        <CardTitle className="text-base md:text-lg">Historial de Actividad</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 md:space-y-3">
          {activities.length === 0 ? (
            <div className="text-center py-6 md:py-8 text-xs md:text-sm text-muted-foreground">
              Sin transacciones. Envía dinero para comenzar.
            </div>
          ) : (
            activities.map((activity, index) => (
              <div
                key={`${activity.id}-${index}`}
                className="flex items-start md:items-center gap-3 md:gap-4 p-2 md:p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors border border-border/50"
              >
                <div
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type.includes('Committed') || activity.type.includes('FundsReserved')
                      ? "bg-primary/20 text-primary"
                      : activity.type.includes('Reversed')
                        ? "bg-destructive/20 text-destructive"
                        : "bg-primary/20 text-primary"
                  }`}
                >
                  {getActivityIcon(activity.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs md:text-sm font-medium text-foreground truncate">
                      {getEventDisplayName(activity.type)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatTime(activity.ts)}</p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span
                    className={`inline-block mt-0.5 md:mt-1 px-1.5 md:px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(activity.type)}`}
                  >
                    {activity.type.split('.').pop()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}




