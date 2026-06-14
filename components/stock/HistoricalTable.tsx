import type { HistoricalFinancialYear } from '@/types/stock'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart2 } from 'lucide-react'

interface Props {
  data: HistoricalFinancialYear[]
}

function oku(v: number | null): string {
  if (v === null) return '---'
  const sign = v < 0 ? '▲' : ''
  return sign + Math.round(Math.abs(v) / 1e8).toLocaleString('ja-JP')
}

function yoy(curr: number | null, prev: number | null): { text: string; positive: boolean } | null {
  if (curr === null || prev === null || prev === 0) return null
  // 黒字↔赤字転換
  if (prev < 0 && curr >= 0) return { text: '黒字転換', positive: true }
  if (prev > 0 && curr < 0) return { text: '赤字転換', positive: false }
  const rate = (curr - prev) / Math.abs(prev) * 100
  const positive = rate >= 0
  return {
    text: `${positive ? '＋' : '▲'}${Math.abs(rate).toFixed(1)}%`,
    positive,
  }
}

function YoY({ curr, prev }: { curr: number | null; prev: number | null }) {
  const result = yoy(curr, prev)
  if (!result) return null
  return (
    <span className={`text-[11px] ${result.positive ? 'text-emerald-600' : 'text-red-500'}`}>
      {result.text}
    </span>
  )
}

function Cell({
  main,
  sub,
  negative,
}: {
  main: string
  sub?: React.ReactNode
  negative?: boolean
}) {
  return (
    <td className="py-2.5 px-3 text-right tabular-nums whitespace-nowrap align-top">
      <div className={`text-sm ${negative ? 'text-red-600' : ''}`}>{main}</div>
      {sub && <div>{sub}</div>}
    </td>
  )
}

export function HistoricalTable({ data }: Props) {
  if (!data || data.length === 0) return null

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-emerald-500" />
            業績推移（直近10年）
          </CardTitle>
          <span className="text-xs text-muted-foreground">金額単位: 億円</span>
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border bg-muted/30 text-xs text-muted-foreground">
                <th className="text-left py-2 pl-6 pr-4 font-medium whitespace-nowrap w-20">決算期</th>
                <th className="text-right py-2 px-3 font-medium whitespace-nowrap">売上高</th>
                <th className="text-right py-2 px-3 font-medium whitespace-nowrap">営業利益</th>
                <th className="text-right py-2 px-3 font-medium whitespace-nowrap">純利益</th>
                <th className="text-right py-2 px-3 font-medium whitespace-nowrap">EPS（円）</th>
                <th className="text-right py-2 pr-6 pl-3 font-medium whitespace-nowrap">営業利益率</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const prev = data[i + 1] ?? null
                const isLatest = i === 0
                return (
                  <tr
                    key={row.fiscalYearEnd}
                    className={`border-b border-border last:border-0 transition-colors hover:bg-muted/20 ${isLatest ? 'bg-emerald-50/50' : ''}`}
                  >
                    <td className="py-2.5 pl-6 pr-4 whitespace-nowrap align-top">
                      <span className={`text-sm font-medium ${isLatest ? 'text-emerald-700' : ''}`}>
                        {row.label}
                      </span>
                      {isLatest && (
                        <span className="ml-1.5 text-[10px] bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded">直近</span>
                      )}
                    </td>
                    <Cell
                      main={oku(row.revenue)}
                      sub={<YoY curr={row.revenue} prev={prev?.revenue ?? null} />}
                    />
                    <Cell
                      main={oku(row.operatingIncome)}
                      negative={row.operatingIncome !== null && row.operatingIncome < 0}
                      sub={<YoY curr={row.operatingIncome} prev={prev?.operatingIncome ?? null} />}
                    />
                    <Cell
                      main={oku(row.netIncome)}
                      negative={row.netIncome !== null && row.netIncome < 0}
                      sub={<YoY curr={row.netIncome} prev={prev?.netIncome ?? null} />}
                    />
                    <Cell
                      main={row.eps !== null ? row.eps.toFixed(1) : '---'}
                      negative={row.eps !== null && row.eps < 0}
                      sub={<YoY curr={row.eps} prev={prev?.eps ?? null} />}
                    />
                    <td className="py-2.5 pr-6 pl-3 text-right tabular-nums whitespace-nowrap align-top">
                      <span className="text-sm">
                        {row.operatingMargin !== null
                          ? `${row.operatingMargin.toFixed(1)}%`
                          : '---'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
