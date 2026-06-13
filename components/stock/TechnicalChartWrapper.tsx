'use client'

import dynamic from 'next/dynamic'
import type { StockPrice } from '@/types/stock'
import type { TechnicalIndicators } from '@/types/analysis'

const TechnicalChart = dynamic(
  () => import('./TechnicalChart').then(m => m.TechnicalChart),
  { ssr: false, loading: () => <div className="h-64 rounded-lg bg-muted animate-pulse" /> }
)

interface Props {
  prices: StockPrice[]
  technical: TechnicalIndicators
}

export function TechnicalChartWrapper({ prices, technical }: Props) {
  return <TechnicalChart prices={prices} technical={technical} />
}
