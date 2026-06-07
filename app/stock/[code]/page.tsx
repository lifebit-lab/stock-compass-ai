import { notFound } from 'next/navigation'
import type { StockAnalysis } from '@/types/analysis'
import { CompanyOverview } from '@/components/stock/CompanyOverview'
import { FinancialScore } from '@/components/stock/FinancialScore'
import { TechnicalChart } from '@/components/stock/TechnicalChart'
import { DeclineAnalysis } from '@/components/stock/DeclineAnalysis'
import { ExclusionWarning } from '@/components/stock/ExclusionWarning'
import { ScoreCard } from '@/components/stock/ScoreCard'
import { InvestmentStyle } from '@/components/stock/InvestmentStyle'
import { getStockPrices, getCompanyInfo, getNikkeiPrices } from '@/lib/jquants'
import { getFinancialData } from '@/lib/edinet'
import { calcTechnicalIndicators } from '@/lib/utils/technical'
import { calcScore, calcInvestmentStyle } from '@/lib/utils/scoring'
import { analyzeDecline, checkExclusion } from '@/lib/utils/decline-rule'

interface Props {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: Props) {
  const { code } = await params
  return {
    title: `${code} の株式分析 — Stock Compass AI`,
  }
}

export default async function StockPage({ params }: Props) {
  const { code } = await params

  if (!/^\d{4}$/.test(code)) notFound()

  const [stockPrices, companyInfo, financial, nikkeiPrices] = await Promise.all([
    getStockPrices(code).catch(() => []),
    getCompanyInfo(code).catch(() => null),
    getFinancialData(code).catch(() => null),
    getNikkeiPrices().catch(() => []),
  ])

  if (!companyInfo) notFound()

  const fin = financial ?? {
    revenueGrowthRate: 0, operatingProfitGrowthRate: 0, epsGrowthRate: 0,
    equityRatio: 0, interestBearingDebt: 0, operatingCashFlow: 0,
    roe: 0, roa: 0, operatingMargin: 0, dividendYield: 0, payoutRatio: 0,
    per: 0, pbr: 0, revenue: [0, 0, 0], operatingProfit: [0, 0, 0], dividendHistory: [0, 0, 0],
  }

  const technical = calcTechnicalIndicators(stockPrices)
  const score = calcScore(fin, technical)
  const decline = analyzeDecline(stockPrices, nikkeiPrices, fin)
  const exclusion = checkExclusion(fin)
  const investmentStyle = calcInvestmentStyle(fin, score)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
      {/* 企業概要 */}
      <CompanyOverview company={companyInfo} code={code} />

      {/* 即除外警告（ある場合のみ表示） */}
      <ExclusionWarning exclusion={exclusion} />

      {/* 2カラムレイアウト */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 左カラム */}
        <div className="space-y-4">
          <ScoreCard score={score} />
          <DeclineAnalysis decline={decline} />
          <InvestmentStyle style={investmentStyle} />
        </div>

        {/* 右カラム */}
        <div className="space-y-4">
          <TechnicalChart prices={stockPrices} technical={technical} />
          <FinancialScore financial={fin} />
        </div>
      </div>
    </div>
  )
}
