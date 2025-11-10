"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, TrendingUp, ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface NewsItem {
  id: string
  title: string
  summary: string
  source: string
  time: string
  category: string
  impact: "positive" | "negative" | "neutral"
}

export default function EconomicNewsCarousel() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)

  // Generar noticias económicas simuladas (en producción, esto vendría de una API)
  useEffect(() => {
    const generateNews = (): NewsItem[] => {
      const categories = ["Mercados", "Política Monetaria", "Empresas", "Comercio", "Tecnología"]
      const sources = ["Bloomberg", "Reuters", "Financial Times", "Wall Street Journal", "El Economista"]
      const impacts: ("positive" | "negative" | "neutral")[] = ["positive", "negative", "neutral"]
      
      const newsItems: NewsItem[] = [
        {
          id: "1",
          title: "Fed mantiene tasas de interés estables en reunión mensual",
          summary: "La Reserva Federal decidió mantener las tasas de interés sin cambios, señalando cautela ante la inflación persistente.",
          source: "Bloomberg",
          time: "Hace 15 minutos",
          category: "Política Monetaria",
          impact: "neutral",
        },
        {
          id: "2",
          title: "Índices bursátiles alcanzan nuevos máximos históricos",
          summary: "Los principales índices del mercado de valores registraron ganancias significativas impulsadas por resultados corporativos sólidos.",
          source: "Reuters",
          time: "Hace 32 minutos",
          category: "Mercados",
          impact: "positive",
        },
        {
          id: "3",
          title: "Tecnología financiera revoluciona servicios bancarios",
          summary: "Las fintech continúan transformando el sector financiero con innovaciones en pagos digitales y banca móvil.",
          source: "Financial Times",
          time: "Hace 1 hora",
          category: "Tecnología",
          impact: "positive",
        },
        {
          id: "4",
          title: "Tensiones comerciales afectan mercados emergentes",
          summary: "Las disputas comerciales internacionales generan volatilidad en las monedas de países emergentes.",
          source: "Wall Street Journal",
          time: "Hace 2 horas",
          category: "Comercio",
          impact: "negative",
        },
        {
          id: "5",
          title: "Grandes tecnológicas reportan crecimiento récord",
          summary: "Las principales empresas tecnológicas superan expectativas con ingresos históricos en el último trimestre.",
          source: "El Economista",
          time: "Hace 3 horas",
          category: "Empresas",
          impact: "positive",
        },
        {
          id: "6",
          title: "Inflación global muestra signos de estabilización",
          summary: "Los indicadores de inflación en las principales economías sugieren una desaceleración gradual.",
          source: "Bloomberg",
          time: "Hace 4 horas",
          category: "Política Monetaria",
          impact: "positive",
        },
      ]

      return newsItems
    }

    // Cargar noticias iniciales
    setNews(generateNews())

    // Actualizar noticias cada 5 minutos
    const interval = setInterval(() => {
      setNews((prevNews) => {
        // Agregar una nueva noticia y remover la más antigua
        const newNews = generateNews()
        const updatedNews = [...newNews.slice(1), {
          ...newNews[0],
          id: Date.now().toString(),
          time: "Justo ahora",
        }]
        return updatedNews
      })
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // Auto-play del carrusel
  useEffect(() => {
    if (!autoPlay || news.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % news.length)
    }, 5000) // Cambiar cada 5 segundos

    return () => clearInterval(interval)
  }, [autoPlay, news.length])

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + news.length) % news.length)
    setAutoPlay(false)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % news.length)
    setAutoPlay(false)
  }

  const handleDotClick = (index: number) => {
    setCurrentIndex(index)
    setAutoPlay(false)
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "positive":
        return "text-green-400"
      case "negative":
        return "text-red-400"
      default:
        return "text-muted-foreground"
    }
  }

  const getImpactIcon = (impact: string) => {
    if (impact === "positive") {
      return <TrendingUp className="w-4 h-4 text-green-400" />
    }
    return null
  }

  if (news.length === 0) {
    return null
  }

  const currentNews = news[currentIndex]

  return (
    <Card className="border-border">
      <CardContent className="p-4 md:p-6">
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base md:text-lg font-semibold text-foreground">Noticias Económicas</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">En vivo</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                className="h-8 w-8"
                disabled={news.length === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="h-8 w-8"
                disabled={news.length === 0}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* News Card */}
          <div className="relative min-h-[180px] md:min-h-[200px]">
            <div
              key={currentNews.id}
              className="space-y-3 animate-in fade-in duration-300"
            >
              {/* Category and Impact */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-secondary text-muted-foreground font-medium">
                    {currentNews.category}
                  </span>
                  {getImpactIcon(currentNews.impact)}
                </div>
                <span className="text-xs text-muted-foreground">{currentNews.time}</span>
              </div>

              {/* Title */}
              <h4 className="text-lg md:text-xl font-bold text-foreground leading-tight">
                {currentNews.title}
              </h4>

              {/* Summary */}
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {currentNews.summary}
              </p>

              {/* Source */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{currentNews.source}</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </div>
                <span className={`text-xs font-medium ${getImpactColor(currentNews.impact)}`}>
                  {currentNews.impact === "positive" && "Alcista"}
                  {currentNews.impact === "negative" && "Bajista"}
                  {currentNews.impact === "neutral" && "Neutral"}
                </span>
              </div>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {news.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Ir a noticia ${index + 1}`}
              />
            ))}
          </div>

          {/* Progress Bar */}
          {autoPlay && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-border overflow-hidden">
              <div className="h-full bg-primary progress-bar" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

