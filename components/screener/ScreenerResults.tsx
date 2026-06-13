import type { ScreenerResult } from '@/types/analysis'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ExternalLink } from 'lucide-react'

interface Props {
  results: ScreenerResult[]
  message?: string
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 75 ? 'bg-emerald-100 text-emerald-700' : score >= 55 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{score}点</span>
}

function Num({ value, unit = '%', good, warn }: {
  value: number
  unit?: string
  good?: (v: number) => boolean
  warn?: (v: number) => boolean
}) {
  if (value === 0) return <span className="text-muted-foreground">---</span>
  const color = good && good(value)
    ? 'text-emerald-600'
    : warn && warn(value)
    ? 'text-yellow-600'
    : undefined
  return <span className={color}>{value.toFixed(1)}{unit}</span>
}

export function ScreenerResults({ results, message }: Props) {
  if (message) {
    return (
      <div className="rounded-lg bg-muted/50 p-6 text-center text-sm text-muted-foreground">
        {message}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="rounded-lg bg-muted/50 p-6 text-center text-sm text-muted-foreground">
        条件に合致する銘柄がありませんでした
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground text-xs">
            <th className="text-left py-2 pr-3 whitespace-nowrap">順位</th>
            <th className="text-left py-2 pr-3 whitespace-nowrap">銘柄</th>
            <th className="text-left py-2 pr-3 whitespace-nowrap">業種</th>
            <th className="text-right py-2 pr-3 whitespace-nowrap">スコア</th>
            <th className="text-right py-2 pr-3 whitespace-nowrap">ROE</th>
            <th className="text-right py-2 pr-3 whitespace-nowrap">営業利益率</th>
            <th className="text-right py-2 pr-3 whitespace-nowrap">自己資本比率</th>
            <th className="text-right py-2 pr-3 whitespace-nowrap">PER</th>
            <th className="text-right py-2 pr-3 whitespace-nowrap">PBR</th>
            <th className="text-right py-2 whitespace-nowrap">配当利回り</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={r.code} className="border-b border-border hover:bg-muted/30 transition-colors">
              <td className="py-2 pr-3 text-muted-foreground">{i + 1}</td>
              <td className="py-2 pr-3">
                <Link href={`/stock/${r.code}`} className="flex items-center gap-1 hover:text-emerald-600 font-medium whitespace-nowrap">
                  {r.name}
                  <span className="text-muted-foreground text-xs">{r.code}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </Link>
              </td>
              <td className="py-2 pr-3">
                <Badge variant="secondary" className="text-xs whitespace-nowrap">{r.sector}</Badge>
              </td>
              <td className="py-2 pr-3 text-right"><ScoreBadge score={r.score} /></td>
              <td className="py-2 pr-3 text-right">
                <Num value={r.roe} good={v => v >= 15} warn={v => v >= 10} />
              </td>
              <td className="py-2 pr-3 text-right">
                <Num value={r.operatingMargin} good={v => v >= 10} warn={v => v >= 5} />
              </td>
              <td className="py-2 pr-3 text-right">
                <Num value={r.equityRatio} good={v => v >= 40} warn={v => v >= 20} />
              </td>
              <td className="py-2 pr-3 text-right">
                <Num value={r.per} unit="倍" good={v => v > 0 && v <= 15} warn={v => v > 0 && v <= 20} />
              </td>
              <td className="py-2 pr-3 text-right">
                <Num value={r.pbr} unit="倍" good={v => v > 0 && v <= 1} warn={v => v > 0 && v <= 1.5} />
              </td>
              <td className="py-2 text-right">
                <Num value={r.dividendYield} good={v => v >= 3} warn={v => v >= 1} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
