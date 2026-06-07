import type { InvestmentStyle as InvestmentStyleType } from '@/types/analysis'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target } from 'lucide-react'

interface Props {
  style: InvestmentStyleType
}

const styleItems = [
  { key: 'highDividend' as const, label: '高配当向き', description: '配当利回り3%以上' },
  { key: 'growth' as const, label: 'グロース向き', description: '売上・EPS成長率8%以上' },
  { key: 'value' as const, label: 'バリュー向き', description: 'PER15倍以下・PBR1.5倍以下' },
  { key: 'longTerm' as const, label: '長期保有向き', description: '財務健全性・成長性・自己資本比率が高水準' },
]

export function InvestmentStyle({ style }: Props) {
  const matched = styleItems.filter(item => style[item.key])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4" />
          投資スタイル判定
        </CardTitle>
      </CardHeader>
      <CardContent>
        {matched.length === 0 ? (
          <p className="text-sm text-muted-foreground">該当する投資スタイルがありません</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {matched.map(item => (
              <div key={item.key} className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
                <p className="text-sm font-semibold text-emerald-700">{item.label}</p>
                <p className="text-xs text-emerald-600">{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
