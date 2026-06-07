import type { FinancialData } from '@/types/stock'
import type { ScoreBreakdown, TechnicalIndicators, InvestmentStyle } from '@/types/analysis'

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value))
}

// 財務健全性スコア（25点満点）
function calcFinancialScore(f: FinancialData): number {
  let score = 0

  // 自己資本比率（10点）
  if (f.equityRatio >= 60) score += 10
  else if (f.equityRatio >= 40) score += 7
  else if (f.equityRatio >= 30) score += 5
  else if (f.equityRatio >= 20) score += 2

  // 営業CF（10点）
  if (f.operatingCashFlow > 0) score += 10
  else if (f.operatingCashFlow === 0) score += 3

  // 有利子負債（5点）：負債が低いほど高スコア
  const debtRatio = f.interestBearingDebt > 0 && f.revenue[0] > 0
    ? f.interestBearingDebt / f.revenue[0]
    : 0
  if (debtRatio < 0.1) score += 5
  else if (debtRatio < 0.3) score += 3
  else if (debtRatio < 0.5) score += 1

  return clamp(score, 0, 25)
}

// 成長性スコア（20点満点）
function calcGrowthScore(f: FinancialData): number {
  let score = 0

  // 売上成長率（8点）
  if (f.revenueGrowthRate >= 10) score += 8
  else if (f.revenueGrowthRate >= 5) score += 6
  else if (f.revenueGrowthRate >= 0) score += 3
  else if (f.revenueGrowthRate >= -5) score += 1

  // 営業利益成長率（8点）
  if (f.operatingProfitGrowthRate >= 10) score += 8
  else if (f.operatingProfitGrowthRate >= 5) score += 6
  else if (f.operatingProfitGrowthRate >= 0) score += 3
  else if (f.operatingProfitGrowthRate >= -10) score += 1

  // EPS成長率（4点）
  if (f.epsGrowthRate >= 10) score += 4
  else if (f.epsGrowthRate >= 0) score += 2

  return clamp(score, 0, 20)
}

// 収益性スコア（15点満点）
function calcProfitabilityScore(f: FinancialData): number {
  let score = 0

  // ROE（6点）
  if (f.roe >= 15) score += 6
  else if (f.roe >= 10) score += 4
  else if (f.roe >= 5) score += 2

  // ROA（5点）
  if (f.roa >= 8) score += 5
  else if (f.roa >= 5) score += 3
  else if (f.roa >= 2) score += 1

  // 営業利益率（4点）
  if (f.operatingMargin >= 15) score += 4
  else if (f.operatingMargin >= 10) score += 3
  else if (f.operatingMargin >= 5) score += 1

  return clamp(score, 0, 15)
}

// 株主還元スコア（10点満点）
function calcShareholderScore(f: FinancialData): number {
  let score = 0

  // 配当利回り（6点）
  if (f.dividendYield >= 4) score += 6
  else if (f.dividendYield >= 3) score += 4
  else if (f.dividendYield >= 2) score += 2
  else if (f.dividendYield >= 1) score += 1

  // 配当性向（4点）：20〜50%が理想
  if (f.payoutRatio >= 20 && f.payoutRatio <= 50) score += 4
  else if (f.payoutRatio > 50 && f.payoutRatio <= 70) score += 2
  else if (f.payoutRatio > 0 && f.payoutRatio < 20) score += 1

  // 配当の安定性（減配なし）
  const divHistory = f.dividendHistory
  if (divHistory.length >= 2 && divHistory[0] >= divHistory[1]) score += 0 // 維持ボーナスは別項目

  return clamp(score, 0, 10)
}

// 割安性スコア（10点満点）
function calcValuationScore(f: FinancialData): number {
  let score = 0

  // PER（5点）
  if (f.per > 0 && f.per <= 10) score += 5
  else if (f.per > 0 && f.per <= 15) score += 3
  else if (f.per > 0 && f.per <= 20) score += 1

  // PBR（5点）
  if (f.pbr > 0 && f.pbr <= 1) score += 5
  else if (f.pbr > 0 && f.pbr <= 1.5) score += 3
  else if (f.pbr > 0 && f.pbr <= 2) score += 1

  return clamp(score, 0, 10)
}

// テクニカルスコア（20点満点）
function calcTechnicalScore(t: TechnicalIndicators): number {
  let score = 0

  // トレンド（8点）
  if (t.trend === 'up') score += 8
  else if (t.trend === 'sideways') score += 4

  // RSI（6点）：30〜70が適正
  if (t.rsi >= 30 && t.rsi <= 70) score += 6
  else if (t.rsi < 30) score += 8 // 売られすぎ → 買いチャンス
  else if (t.rsi > 70) score += 2 // 買われすぎ

  // MACD（6点）
  const lastHistogram = t.macd.histogram.filter(v => !isNaN(v)).slice(-1)[0] ?? 0
  if (lastHistogram > 0) score += 6
  else if (lastHistogram === 0) score += 3

  return clamp(score, 0, 20)
}

export function calcScore(financial: FinancialData, technical: TechnicalIndicators): ScoreBreakdown {
  const fin = calcFinancialScore(financial)
  const growth = calcGrowthScore(financial)
  const profitability = calcProfitabilityScore(financial)
  const shareholder = calcShareholderScore(financial)
  const valuation = calcValuationScore(financial)
  const tech = calcTechnicalScore(technical)

  return {
    financial: fin,
    growth,
    profitability,
    shareholder,
    valuation,
    technical: tech,
    total: fin + growth + profitability + shareholder + valuation + tech,
  }
}

export function calcInvestmentStyle(financial: FinancialData, score: ScoreBreakdown): InvestmentStyle {
  return {
    highDividend: financial.dividendYield >= 3,
    growth: financial.revenueGrowthRate >= 8 && financial.epsGrowthRate >= 8,
    value: financial.per > 0 && financial.per <= 15 && financial.pbr > 0 && financial.pbr <= 1.5,
    longTerm: score.financial >= 18 && score.growth >= 12 && financial.equityRatio >= 40,
  }
}
