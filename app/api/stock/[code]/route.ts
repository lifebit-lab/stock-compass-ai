import { NextRequest, NextResponse } from 'next/server'
import { getStockPrices, getCompanyInfo, getNikkeiPrices } from '@/lib/jquants'
import { getFinancialData } from '@/lib/edinet'
import { calcTechnicalIndicators } from '@/lib/utils/technical'
import { calcScore, calcInvestmentStyle } from '@/lib/utils/scoring'
import { analyzeDecline, checkExclusion } from '@/lib/utils/decline-rule'
import type { StockAnalysis } from '@/types/analysis'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  if (!/^\d{4}$/.test(code)) {
    return NextResponse.json({ error: '銘柄コードは4桁の数字で入力してください' }, { status: 400 })
  }

  const [stockPrices, companyInfo, financial, nikkeiPrices] = await Promise.all([
    getStockPrices(code),
    getCompanyInfo(code),
    getFinancialData(code),
    getNikkeiPrices(),
  ])

  if (!companyInfo) {
    return NextResponse.json({ error: '銘柄が見つかりませんでした' }, { status: 404 })
  }

  const technical = calcTechnicalIndicators(stockPrices)
  const score = calcScore(financial, technical)
  const decline = analyzeDecline(stockPrices, nikkeiPrices, financial)
  const exclusion = checkExclusion(financial)
  const investmentStyle = calcInvestmentStyle(financial, score)

  const analysis: StockAnalysis = {
    code,
    company: companyInfo,
    financial,
    technical,
    decline,
    exclusion,
    score,
    investmentStyle,
    analyzedAt: new Date().toISOString(),
  }

  return NextResponse.json(analysis)
}
