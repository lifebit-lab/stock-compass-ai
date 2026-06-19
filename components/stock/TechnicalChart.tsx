'use client'

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { StockPrice } from '@/types/stock'
import type { TechnicalIndicators } from '@/types/analysis'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LineChart } from 'lucide-react'

interface Props {
  prices: StockPrice[]
  technical: TechnicalIndicators
}

const trendLabels = {
  up: { label: '上昇トレンド', color: 'bg-emerald-100 text-emerald-700' },
  down: { label: '下降トレンド', color: 'bg-red-100 text-red-700' },
  sideways: { label: 'もみ合い', color: 'bg-yellow-100 text-yellow-700' },
}

// 日付文字列を YYYYMMDD 8桁に正規化
function toCompact(raw: string): string {
  return raw ? raw.replace(/-/g, '') : ''
}

// YYYYMMDD → "YYYY/MM/DD"
function toFullDate(compact: string): string {
  if (compact.length < 8) return compact
  return `${compact.slice(0, 4)}/${compact.slice(4, 6)}/${compact.slice(6, 8)}`
}

// YYYYMMDD → "MM/DD"
function toMonthDay(compact: string): string {
  if (compact.length < 8) return compact
  return `${compact.slice(4, 6)}/${compact.slice(6, 8)}`
}

export function TechnicalChart({ prices, technical }: Props) {
  // 直近252件（約1年）に絞る
  const recent = prices.slice(-252)
  const offset = prices.length - recent.length

  // チャートに表示する期間ラベルを生成（年付き）
  const firstCompact = toCompact(recent.at(0)?.date ?? '')
  const lastCompact = toCompact(recent.at(-1)?.date ?? '')
  const periodLabel = firstCompact && lastCompact
    ? `${toFullDate(firstCompact)} 〜 ${toFullDate(lastCompact)}`
    : ''

  const chartData = recent.map((p, i) => {
    const idx = offset + i
    const compact = toCompact(p.date ?? '')
    return {
      date: toMonthDay(compact),      // X軸表示用 MM/DD
      fullDate: toFullDate(compact),  // ツールチップ用 YYYY/MM/DD
      close: p.close,
      volume: p.volume,
      ma25: isNaN(technical.ma25[idx]) ? undefined : Math.round(technical.ma25[idx]),
      ma75: isNaN(technical.ma75[idx]) ? undefined : Math.round(technical.ma75[idx]),
      bbUpper: isNaN(technical.bollingerBands.upper[idx]) ? undefined : Math.round(technical.bollingerBands.upper[idx]),
      bbLower: isNaN(technical.bollingerBands.lower[idx]) ? undefined : Math.round(technical.bollingerBands.lower[idx]),
    }
  })

  const trend = trendLabels[technical.trend]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <LineChart className="h-4 w-4" />
          テクニカル分析
          <Badge className={`ml-auto text-xs ${trend.color} border-0`}>{trend.label}</Badge>
        </CardTitle>
        {periodLabel && (
          <p className="text-xs text-muted-foreground mt-0.5">{periodLabel}</p>
        )}
      </CardHeader>
      <CardContent>
        {/* 指標サマリー */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">RSI(14)</p>
            <p className={`text-sm font-semibold ${technical.rsi < 30 ? 'text-emerald-600' : technical.rsi > 70 ? 'text-red-600' : 'text-foreground'}`}>
              {technical.rsi.toFixed(1)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">RSI判定</p>
            <p className="text-sm font-semibold">
              {technical.rsi < 30 ? '売られすぎ' : technical.rsi > 70 ? '買われすぎ' : '適正'}
            </p>
          </div>
        </div>

        {/* 株価チャート */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              {/* dataKey=fullDateでtooltipに年付き日付を渡し、tickFormatterでMM/DDのみ表示 */}
              <XAxis
                dataKey="fullDate"
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 10 }} width={50} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                formatter={(value) => typeof value === 'number' ? value.toLocaleString() : value}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="volume" fill="#e5e7eb" yAxisId={1} hide />
              <YAxis yAxisId={1} orientation="right" hide />
              <Line type="monotone" dataKey="close" stroke="#6366f1" dot={false} strokeWidth={1.5} name="終値" />
              <Line type="monotone" dataKey="ma25" stroke="#f59e0b" dot={false} strokeWidth={1} name="MA25" />
              <Line type="monotone" dataKey="ma75" stroke="#ef4444" dot={false} strokeWidth={1} name="MA75" />
              <Line type="monotone" dataKey="bbUpper" stroke="#94a3b8" dot={false} strokeWidth={1} strokeDasharray="3 3" name="BB上限" />
              <Line type="monotone" dataKey="bbLower" stroke="#94a3b8" dot={false} strokeWidth={1} strokeDasharray="3 3" name="BB下限" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
