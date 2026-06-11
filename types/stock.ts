export interface StockPrice {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  adjustedClose?: number
}

export interface CompanyInfo {
  code: string
  name: string
  sector: string
  marketCapitalization: number
  exchange: string
}

export interface FinancialData {
  // 成長性
  revenueGrowthRate: number        // 売上成長率（%）
  operatingProfitGrowthRate: number // 営業利益成長率（%）
  epsGrowthRate: number            // EPS成長率（%）
  // 安全性
  equityRatio: number              // 自己資本比率（%）
  interestBearingDebt: number      // 有利子負債（百万円）
  operatingCashFlow: number        // 営業CF（百万円）
  // 収益性
  roe: number                      // ROE（%）
  roa: number                      // ROA（%）
  operatingMargin: number          // 営業利益率（%）
  // 株主還元
  dividendYield: number            // 配当利回り（%）
  payoutRatio: number              // 配当性向（%）
  // バリュエーション
  per: number                      // PER（倍）
  pbr: number                      // PBR（倍）
  // 追加
  revenue: number[]                // 直近3年売上（円）
  operatingProfit: number[]        // 直近3年営業利益（円）
  dividendHistory: number[]        // 直近3年配当（円）
  // 計算用中間値（API内部で使用）
  eps?: number                     // EPS（円）
  bps?: number                     // BPS（円）
  divPerShare?: number             // 年間配当（円）
}
