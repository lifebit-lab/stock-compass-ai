import type { StockPrice, FinancialData } from '@/types/stock'
import type { DeclineAnalysis, ExclusionWarning } from '@/types/analysis'
import { calcDeclineRate } from './technical'

// 下落理由をルールベースで判定
export function analyzeDecline(
  stockPrices: StockPrice[],
  nikkeiPrices: StockPrice[],
  financial: FinancialData
): DeclineAnalysis {
  const stockDecline5d = calcDeclineRate(stockPrices, 5)
  const stockDecline20d = calcDeclineRate(stockPrices, 20)
  const nikkeiDecline5d = calcDeclineRate(nikkeiPrices, 5)
  const nikkeiDecline20d = calcDeclineRate(nikkeiPrices, 20)

  let marketScore = 0
  let sectorScore = 0
  let companyScore = 0
  let structuralScore = 0

  // 市場全体要因：日経平均が-5%以上下落している
  if (nikkeiDecline5d <= -5) marketScore += 50
  else if (nikkeiDecline5d <= -3) marketScore += 30
  else if (nikkeiDecline5d <= -1) marketScore += 10

  // 株の下落が日経と連動している（相関が高い）
  if (stockDecline5d < 0 && nikkeiDecline5d < 0) {
    const correlation = stockDecline5d / nikkeiDecline5d
    if (correlation >= 0.8 && correlation <= 1.5) marketScore += 30
  }

  // 業界要因：個別株の下落が日経より大きいが、突出して大きくはない
  if (stockDecline20d < nikkeiDecline20d - 5) {
    sectorScore += 40
  }

  // 企業要因（一時的）：直近決算が減益
  if (financial.operatingProfitGrowthRate < -10) companyScore += 40
  else if (financial.operatingProfitGrowthRate < 0) companyScore += 20

  // 構造的問題の判定
  const revenueDecreasing = financial.revenue.every((r, i) =>
    i === 0 ? true : r <= financial.revenue[i - 1]
  )
  if (revenueDecreasing && financial.revenue.length >= 3) structuralScore += 30

  if (financial.operatingCashFlow < 0) structuralScore += 30
  if (financial.equityRatio < 20) structuralScore += 20
  if (financial.roe < 0) structuralScore += 20

  // スコアを正規化（最大100）
  const total = marketScore + sectorScore + companyScore + structuralScore
  const normalize = (v: number) => total > 0 ? Math.round((v / total) * 100) : 25

  const causes = {
    market: normalize(marketScore),
    sector: normalize(sectorScore),
    company: normalize(companyScore),
    structural: normalize(structuralScore),
  }

  // 主要因を決定
  const maxEntry = Object.entries(causes).sort((a, b) => b[1] - a[1])[0]
  const primaryCause = maxEntry[0] as DeclineAnalysis['primaryCause']

  // 一時的な下落かどうか（市場/業界/一時的企業要因が主因で構造的問題が低い場合）
  const isTemporary = structuralScore < 30 && (marketScore + sectorScore + companyScore) > structuralScore

  const summaryMap: Record<string, string> = {
    market: `現在の下落は日経平均全体の調整局面に連動したものとみられます。企業価値そのものの毀損は確認されておらず、一時的な下落の可能性が高いです。`,
    sector: `業界全体に影響する外部要因による下落が主因とみられます。個別企業の問題というよりも、セクター全体の調整局面にある可能性があります。`,
    company: `直近の決算内容や企業固有の一時的な要因による下落が考えられます。中長期の事業基盤に変化がなければ回復が期待されます。`,
    structural: `事業の構造的な課題（継続的な減収・CF悪化等）が確認されます。慎重な判断が必要です。`,
    unknown: `下落の主因を特定するための十分なデータがありません。`,
  }

  return {
    primaryCause,
    causes,
    isTemporary,
    summary: summaryMap[primaryCause] ?? summaryMap.unknown,
  }
}

// 即除外フィルター
export function checkExclusion(financial: FinancialData): ExclusionWarning {
  const reasons: string[] = []

  // 3年連続減収
  if (
    financial.revenue.length >= 3 &&
    financial.revenue[0] < financial.revenue[1] &&
    financial.revenue[1] < financial.revenue[2]
  ) {
    reasons.push('3年連続で売上が減少しています')
  }

  // 営業CFマイナス
  if (financial.operatingCashFlow < 0) {
    reasons.push('営業キャッシュフローがマイナスです')
  }

  // 自己資本比率20%未満
  if (financial.equityRatio > 0 && financial.equityRatio < 20) {
    reasons.push(`自己資本比率が${financial.equityRatio.toFixed(1)}%と低水準です`)
  }

  // 減配
  if (
    financial.dividendHistory.length >= 2 &&
    financial.dividendHistory[0] > 0 &&
    financial.dividendHistory[0] < financial.dividendHistory[1]
  ) {
    reasons.push('直近期に減配が確認されています')
  }

  // ROE 5%未満
  if (financial.roe > 0 && financial.roe < 5) {
    reasons.push(`ROEが${financial.roe.toFixed(1)}%と低水準です`)
  }

  return {
    triggered: reasons.length > 0,
    reasons,
  }
}
