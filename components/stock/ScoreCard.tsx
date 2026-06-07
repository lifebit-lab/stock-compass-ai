'use client'

import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import type { ScoreBreakdown } from '@/types/analysis'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  score: ScoreBreakdown
}

function ScoreItem({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-medium w-12 text-right">{value}/{max}</span>
    </div>
  )
}

function scoreColor(total: number): string {
  if (total >= 75) return 'text-emerald-500'
  if (total >= 55) return 'text-yellow-500'
  return 'text-red-500'
}

function scoreLabel(total: number): string {
  if (total >= 80) return '優良'
  if (total >= 65) return '良好'
  if (total >= 50) return '普通'
  if (total >= 35) return '注意'
  return '要検討'
}

export function ScoreCard({ score }: Props) {
  const chartData = [{ value: score.total, fill: score.total >= 75 ? '#10b981' : score.total >= 55 ? '#eab308' : '#ef4444' }]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">AI総合スコア</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* 円グラフ */}
          <div className="relative h-32 w-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="65%"
                outerRadius="90%"
                data={chartData}
                startAngle={90}
                endAngle={90 - 360 * (score.total / 100)}
              >
                <RadialBar dataKey="value" background={{ fill: '#e5e7eb' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${scoreColor(score.total)}`}>{score.total}</span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>

          {/* 内訳 */}
          <div className="flex-1 w-full space-y-2">
            <div className="mb-3">
              <span className={`text-sm font-semibold px-2 py-0.5 rounded ${score.total >= 75 ? 'bg-emerald-100 text-emerald-700' : score.total >= 55 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                {scoreLabel(score.total)}
              </span>
            </div>
            <ScoreItem label="財務健全性" value={score.financial} max={25} color="bg-blue-500" />
            <ScoreItem label="成長性" value={score.growth} max={20} color="bg-emerald-500" />
            <ScoreItem label="収益性" value={score.profitability} max={15} color="bg-purple-500" />
            <ScoreItem label="株主還元" value={score.shareholder} max={10} color="bg-pink-500" />
            <ScoreItem label="割安性" value={score.valuation} max={10} color="bg-orange-500" />
            <ScoreItem label="テクニカル" value={score.technical} max={20} color="bg-cyan-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
