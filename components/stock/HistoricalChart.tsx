'use client'

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { HistoricalFinancialYear } from '@/types/stock'

interface Props {
  data: HistoricalFinancialYear[]
}

function okuShort(v: number): string {
  const oku = Math.round(Math.abs(v) / 1e8)
  if (oku >= 10000) return `${(oku / 10000).toFixed(1)}兆`
  if (oku >= 1000) return `${(oku / 1000).toFixed(0)}千`
  return `${oku.toLocaleString('ja-JP')}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const get = (key: string) => payload.find((p: any) => p.dataKey === key)
  const rev = get('revenue')
  const op  = get('operatingIncome')
  const opm = get('operatingMargin')
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2.5 text-xs shadow-lg">
      <p className="font-semibold text-sm mb-1.5 text-foreground">{label}</p>
      {rev?.value != null && (
        <p className="text-muted-foreground flex justify-between gap-4">
          <span>売上高</span>
          <span className="font-medium text-foreground tabular-nums">{okuShort(rev.value)}億</span>
        </p>
      )}
      {op?.value != null && (
        <p className="text-muted-foreground flex justify-between gap-4">
          <span>営業利益</span>
          <span className="font-medium text-emerald-600 tabular-nums">{okuShort(op.value)}億</span>
        </p>
      )}
      {opm?.value != null && (
        <p className="text-muted-foreground flex justify-between gap-4">
          <span>営業利益率</span>
          <span className="font-medium text-foreground tabular-nums">{opm.value.toFixed(1)}%</span>
        </p>
      )}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomLegend({ payload }: any) {
  const labels: Record<string, string> = {
    revenue: '売上高',
    operatingIncome: '営業利益',
    operatingMargin: '営業利益率',
  }
  return (
    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-1">
      {payload?.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (entry: any) => (
          <span key={entry.dataKey} className="flex items-center gap-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            {labels[entry.dataKey] ?? entry.dataKey}
          </span>
        )
      )}
    </div>
  )
}

export function HistoricalChart({ data }: Props) {
  // 古い順（左→右）に並べ替えてチャート用データ作成
  const chartData = [...data].reverse().map(d => ({
    label: d.label,
    revenue: d.revenue,
    operatingIncome: d.operatingIncome,
    operatingMargin: d.operatingMargin,
  }))

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 4, right: 44, bottom: 0, left: 8 }}
          barGap={2}
          barCategoryGap="28%"
        >
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          {/* 左Y軸: 億円 */}
          <YAxis
            yAxisId="oku"
            orientation="left"
            tickFormatter={v => okuShort(v)}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          {/* 右Y軸: % */}
          <YAxis
            yAxisId="pct"
            orientation="right"
            tickFormatter={v => `${v}%`}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            domain={[0, 'auto']}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
          <Legend content={<CustomLegend />} />
          <Bar
            yAxisId="oku"
            dataKey="revenue"
            fill="#d1fae5"
            radius={[2, 2, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            yAxisId="oku"
            dataKey="operatingIncome"
            fill="#059669"
            radius={[2, 2, 0, 0]}
            maxBarSize={28}
          />
          <Line
            yAxisId="pct"
            dataKey="operatingMargin"
            stroke="#9ca3af"
            strokeWidth={2}
            dot={{ r: 3, fill: '#9ca3af', strokeWidth: 0 }}
            activeDot={{ r: 4, fill: '#6b7280', strokeWidth: 0 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
