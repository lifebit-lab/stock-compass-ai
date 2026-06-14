import { notFound } from 'next/navigation'
import { CompanyOverview } from '@/components/stock/CompanyOverview'
import { FinancialScore } from '@/components/stock/FinancialScore'
import { DeclineAnalysis } from '@/components/stock/DeclineAnalysis'
import { ExclusionWarning } from '@/components/stock/ExclusionWarning'
import { ScoreCard } from '@/components/stock/ScoreCard'
import { InvestmentStyle } from '@/components/stock/InvestmentStyle'
import { TechnicalChartWrapper } from '@/components/stock/TechnicalChartWrapper'
import { HistoricalSection } from '@/components/stock/HistoricalSection'
import { IRLinks } from '@/components/stock/IRLinks'
import { getStockPrices, getCompanyInfo, getNikkeiPrices } from '@/lib/jquants'
import { getFinancialData } from '@/lib/edinet'
import { getHistoricalFinancials, getIRWebsite } from '@/lib/yahoo-finance'
import { calcTechnicalIndicators } from '@/lib/utils/technical'
import { calcScore, calcInvestmentStyle } from '@/lib/utils/scoring'
import { analyzeDecline, checkExclusion } from '@/lib/utils/decline-rule'
import type { PeriodInfo } from '@/types/analysis'

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

  const [stockPrices, companyInfo, financial, nikkeiPrices, historicalData, irWebsite] = await Promise.all([
    getStockPrices(code).catch(() => []),
    getCompanyInfo(code).catch(() => null),
    getFinancialData(code).catch(() => null),
    getNikkeiPrices().catch(() => []),
    getHistoricalFinancials(code).catch(() => []),
    getIRWebsite(code).catch(() => undefined),
  ])

  if (!companyInfo) notFound()

  const fin = financial ?? {
    revenueGrowthRate: 0, operatingProfitGrowthRate: 0, epsGrowthRate: 0,
    equityRatio: 0, interestBearingDebt: 0, operatingCashFlow: 0,
    roe: 0, roa: 0, operatingMargin: 0, dividendYield: 0, payoutRatio: 0,
    per: 0, pbr: 0, revenue: [0, 0, 0], operatingProfit: [0, 0, 0], dividendHistory: [0, 0, 0],
  }

  // 直近株価でPER・PBR・配当利回りを算出
  const latestPrice = stockPrices.at(-1)?.adjustedClose ?? stockPrices.at(-1)?.close ?? 0
  if (latestPrice > 0) {
    if (fin.eps && fin.eps > 0) fin.per = latestPrice / fin.eps
    if (fin.bps && fin.bps > 0) fin.pbr = latestPrice / fin.bps
    if (fin.divPerShare && fin.divPerShare > 0) fin.dividendYield = (fin.divPerShare / latestPrice) * 100
  }

  const technical = calcTechnicalIndicators(stockPrices)
  const score = calcScore(fin, technical)
  const decline = analyzeDecline(stockPrices, nikkeiPrices, fin)
  const exclusion = checkExclusion(fin)
  const investmentStyle = calcInvestmentStyle(fin, score)

  const periodInfo: PeriodInfo = {
    financialPeriod: fin.period ?? null,
    stockPricePeriod: stockPrices.length > 0
      ? { start: stockPrices[0].date, end: stockPrices[stockPrices.length - 1].date }
      : null,
  }

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
          <ScoreCard score={score} periodInfo={periodInfo} />
          <DeclineAnalysis decline={decline} periodInfo={periodInfo} />
          <InvestmentStyle style={investmentStyle} />
        </div>

        {/* 右カラム */}
        <div className="space-y-4">
          <TechnicalChartWrapper prices={stockPrices} technical={technical} />
          <FinancialScore financial={fin} periodInfo={periodInfo} />
        </div>
      </div>

      {/* 業績推移（10年） */}
      <HistoricalSection data={historicalData} />

      {/* IR・開示資料 */}
      <IRLinks code={code} companyName={companyInfo.name} irWebsite={irWebsite} />
    </div>
  )
}
