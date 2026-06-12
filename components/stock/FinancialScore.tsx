import type { FinancialData } from '@/types/stock'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

interface Props {
  financial: FinancialData
}

// 大きな金額を億円単位で表示
function formatOkuYen(yen: number): string {
  if (yen === 0) return '---'
  const oku = yen / 100_000_000
  return `${oku >= 0 ? '+' : ''}${oku.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}億円`
}

function MetricRow({ label, value, unit = '', good, warn, format, extreme }: {
  label: string
  value: number
  unit?: string
  good: (v: number) => boolean
  warn: (v: number) => boolean
  format?: (v: number) => string
  extreme?: boolean  // 異常値フラグ（会計基準変更等）
}) {
  const color = value === 0
    ? 'text-muted-foreground'
    : extreme
    ? 'text-yellow-600'
    : good(value) ? 'text-emerald-600' : warn(value) ? 'text-yellow-600' : 'text-red-600'
  const display = value === 0 ? '---' : format ? format(value) : `${value.toFixed(1)}${unit}`

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${color}`}>
        {display}
        {extreme && <span className="text-xs text-yellow-600 ml-1">※</span>}
      </span>
    </div>
  )
}

export function FinancialScore({ financial: f }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          財務分析
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          {/* 成長性 */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">成長性</p>
            <MetricRow label="売上成長率" value={f.revenueGrowthRate} unit="%" good={v => v >= 5 && v < 100} warn={v => v >= 0} extreme={Math.abs(f.revenueGrowthRate) > 100} />
            <MetricRow label="営業利益成長率" value={f.operatingProfitGrowthRate} unit="%" good={v => v >= 5 && v < 100} warn={v => v >= 0} extreme={Math.abs(f.operatingProfitGrowthRate) > 100} />
            <MetricRow label="EPS成長率" value={f.epsGrowthRate} unit="%" good={v => v >= 5 && v < 100} warn={v => v >= 0} extreme={Math.abs(f.epsGrowthRate) > 100} />
            {(Math.abs(f.revenueGrowthRate) > 100 || Math.abs(f.epsGrowthRate) > 100) && (
              <p className="text-xs text-yellow-600 mt-1">※会計基準変更等の影響で参考値となる場合があります</p>
            )}
          </div>

          {/* 安全性 */}
          <div className="mt-4 sm:mt-0">
            <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">安全性</p>
            <MetricRow label="自己資本比率" value={f.equityRatio} unit="%" good={v => v >= 40} warn={v => v >= 20} />
            <MetricRow label="営業CF" value={f.operatingCashFlow} good={v => v > 0} warn={() => false} format={formatOkuYen} />
          </div>

          {/* 収益性 */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">収益性</p>
            <MetricRow label="ROE" value={f.roe} unit="%" good={v => v >= 10} warn={v => v >= 5} />
            <MetricRow label="ROA" value={f.roa} unit="%" good={v => v >= 5} warn={v => v >= 2} />
            <MetricRow label="営業利益率" value={f.operatingMargin} unit="%" good={v => v >= 10} warn={v => v >= 5} />
          </div>

          {/* バリュエーション・株主還元 */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">バリュエーション</p>
            <MetricRow label="PER" value={f.per} unit="倍" good={v => v > 0 && v <= 15} warn={v => v > 0 && v <= 20} />
            <MetricRow label="PBR" value={f.pbr} unit="倍" good={v => v > 0 && v <= 1} warn={v => v > 0 && v <= 1.5} />
            <MetricRow label="配当利回り" value={f.dividendYield} unit="%" good={v => v >= 3} warn={v => v >= 1} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
