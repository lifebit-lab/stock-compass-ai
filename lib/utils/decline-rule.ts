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

  // 各要因に基準スコアを加算（データ不足時に1要因100%と断定されるのを防ぐ）
  const BASE = 10
  const adjMarket = marketScore + BASE
  const adjSector = sectorScore + BASE
  const adjCompany = companyScore + BASE
  const adjStructural = structuralScore + BASE
  const total = adjMarket + adjSector + adjCompany + adjStructural

  const causes = {
    market: Math.round((adjMarket / total) * 100),
    sector: Math.round((adjSector / total) * 100),
    company: Math.round((adjCompany / total) * 100),
    structural: Math.round((adjStructural / total) * 100),
  }

  // 主要因を決定（最もスコアが高い要因）
  const maxEntry = Object.entries({ marketScore, sectorScore, companyScore, structuralScore })
    .sort((a, b) => b[1] - a[1])[0]
  const causeKey = maxEntry[0].replace('Score', '') as DeclineAnalysis['primaryCause']
  const primaryCause = maxEntry[1] > 0 ? causeKey : 'unknown' as DeclineAnalysis['primaryCause']

  // 一時的な下落かどうか（構造的問題が相対的に小さい場合）
  const isTemporary = structuralScore < 30 && structuralScore < (marketScore + sectorScore + companyScore)

  const summaryMap: Record<string, string> = {
    market: `日経平均全体の調整局面との連動が主因と推定されます（※参考値）。企業固有のリスクも別途確認してください。`,
    sector: `業界全体への影響が主因と推定されます（※参考値）。個別企業の問題かどうかは決算内容を確認してください。`,
    company: `直近の決算など企業固有の要因が主因と推定されます（※参考値）。中長期の事業基盤の変化を確認してください。`,
    structural: `継続的な減収・CF悪化など構造的な課題の兆候が確認されます（※参考値）。慎重な判断が必要です。`,
    unknown: `下落の主因を特定するための十分なデータがありません。複数の要因を個別に確認してください。`,
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
