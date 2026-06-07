export type DeclineCause =
  | 'market'     // 市場全体要因
  | 'sector'     // 業界要因
  | 'company'    // 一時的企業要因
  | 'structural' // 構造的問題
  | 'unknown'    // 不明

export interface DeclineAnalysis {
  primaryCause: DeclineCause
  causes: {
    market: number      // 市場要因スコア（0-100）
    sector: number      // 業界要因スコア（0-100）
    company: number     // 企業要因スコア（0-100）
    structural: number  // 構造的問題スコア（0-100）
  }
  isTemporary: boolean  // 一時的な下落か
  summary: string
}

export interface ExclusionWarning {
  triggered: boolean
  reasons: string[]
}

export interface TechnicalIndicators {
  ma25: number[]     // 25日移動平均
  ma75: number[]     // 75日移動平均
  rsi: number        // RSI（直近値）
  macd: {
    macd: number[]
    signal: number[]
    histogram: number[]
  }
  bollingerBands: {
    upper: number[]
    middle: number[]
    lower: number[]
  }
  trend: 'up' | 'down' | 'sideways'
}

export interface ScoreBreakdown {
  financial: number    // 財務健全性（25点）
  growth: number       // 成長性（20点）
  profitability: number // 収益性（15点）
  shareholder: number  // 株主還元（10点）
  valuation: number    // 割安性（10点）
  technical: number    // テクニカル（20点）
  total: number        // 合計（100点）
}

export interface InvestmentStyle {
  highDividend: boolean   // 高配当向き
  growth: boolean         // グロース向き
  value: boolean          // バリュー向き
  longTerm: boolean       // 長期保有向き
}

export interface StockAnalysis {
  code: string
  company: import('./stock').CompanyInfo
  financial: import('./stock').FinancialData
  technical: TechnicalIndicators
  decline: DeclineAnalysis
  exclusion: ExclusionWarning
  score: ScoreBreakdown
  investmentStyle: InvestmentStyle
  analyzedAt: string
}

export interface ScreenerCondition {
  roe?: { min?: number; max?: number }
  per?: { min?: number; max?: number }
  equityRatio?: { min?: number; max?: number }
  revenueGrowthRate?: { min?: number; max?: number }
  dividendYield?: { min?: number; max?: number }
  pbr?: { min?: number; max?: number }
  operatingMargin?: { min?: number; max?: number }
}

export interface ScreenerResult {
  code: string
  name: string
  sector: string
  score: number
  roe: number
  per: number
  equityRatio: number
  dividendYield: number
  revenueGrowthRate: number
}
