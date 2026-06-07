import type { DeclineAnalysis as DeclineAnalysisType } from '@/types/analysis'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, TrendingDown, CheckCircle2 } from 'lucide-react'

interface Props {
  decline: DeclineAnalysisType
}

const causeLabels: Record<string, string> = {
  market: '市場全体要因',
  sector: '業界要因',
  company: '一時的企業要因',
  structural: '構造的問題',
  unknown: '不明',
}

const causeColors: Record<string, string> = {
  market: 'bg-blue-100 text-blue-700',
  sector: 'bg-yellow-100 text-yellow-700',
  company: 'bg-orange-100 text-orange-700',
  structural: 'bg-red-100 text-red-700',
  unknown: 'bg-gray-100 text-gray-700',
}

export function DeclineAnalysis({ decline }: Props) {
  const sortedCauses = Object.entries(decline.causes)
    .sort((a, b) => b[1] - a[1])

  return (
    <Card className={decline.isTemporary ? 'border-emerald-200' : 'border-red-200'}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingDown className="h-4 w-4" />
          下落理由分析
          <span className="ml-auto">
            {decline.isTemporary ? (
              <Badge className="bg-emerald-100 text-emerald-700 border-0">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                一時的な下落
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-700 border-0">
                <AlertTriangle className="h-3 w-3 mr-1" />
                要注意
              </Badge>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 主因 */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">主な下落要因</p>
          <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${causeColors[decline.primaryCause]}`}>
            {causeLabels[decline.primaryCause]}
          </span>
        </div>

        {/* 要因の内訳バー */}
        <div className="space-y-2">
          {sortedCauses.map(([key, pct]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-24 shrink-0">{causeLabels[key]}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${key === 'structural' ? 'bg-red-400' : key === 'market' ? 'bg-blue-400' : key === 'sector' ? 'bg-yellow-400' : 'bg-orange-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-medium w-8 text-right">{pct}%</span>
            </div>
          ))}
        </div>

        {/* AIコメント */}
        <div className={`rounded-lg p-3 text-sm ${decline.isTemporary ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
          {decline.summary}
        </div>
      </CardContent>
    </Card>
  )
}
