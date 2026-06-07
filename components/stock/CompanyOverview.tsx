import type { CompanyInfo } from '@/types/stock'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2 } from 'lucide-react'

interface Props {
  company: CompanyInfo
  code: string
}

function formatMarketCap(value: number): string {
  if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(1)}兆円`
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(0)}億円`
  return `${value.toLocaleString()}円`
}

export function CompanyOverview({ company, code }: Props) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{company.name}</h1>
                <span className="text-sm text-muted-foreground">{code}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{company.sector}</Badge>
                <span className="text-sm text-muted-foreground">{company.exchange}</span>
              </div>
            </div>
          </div>
          {company.marketCapitalization > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">時価総額</p>
              <p className="text-lg font-semibold">{formatMarketCap(company.marketCapitalization)}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
