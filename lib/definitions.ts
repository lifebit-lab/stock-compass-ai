import type { PeriodInfo } from '@/types/analysis'

export interface MetricDefinition {
  definition: string
}

// 財務指標の定義テキスト
export const FINANCIAL_DEFINITIONS: Record<string, MetricDefinition> = {
  revenueGrowthRate: {
    definition: '前期比の売上高成長率。企業のビジネス拡大ペースを示します。5%以上が成長、マイナスは縮小を意味します。',
  },
  operatingProfitGrowthRate: {
    definition: '前期比の営業利益成長率。本業の利益がどれだけ増えたかを示します。売上成長率と合わせて収益効率の改善を確認します。',
  },
  epsGrowthRate: {
    definition: '1株当たり利益（EPS）の前期比成長率。株主にとっての利益成長を示す最も重要な指標の一つです。',
  },
  equityRatio: {
    definition: '総資産に占める自己資本の割合。高いほど財務的に安定しており、40%以上が健全とされています。',
  },
  operatingCashFlow: {
    definition: '本業から生み出された現金の増減。プラスであれば本業で現金を稼げており、財務の実態を反映します。',
  },
  interestBearingDebt: {
    definition: '返済義務のある負債（借入金・社債など）の総額。売上高に対する比率が低いほど財務リスクが小さいとされます。',
  },
  roe: {
    definition: '株主資本利益率。株主が出資した資本に対して何%の利益を上げたかを示します。15%以上が優良とされています。',
  },
  roa: {
    definition: '総資産利益率。企業が保有する全資産を使ってどれだけ利益を生み出しているかを示します。5%以上が目安です。',
  },
  operatingMargin: {
    definition: '売上高に占める営業利益の割合。本業の収益効率を示します。業種によって水準は異なりますが、10%以上は優良です。',
  },
  dividendYield: {
    definition: '株価に対する年間配当の割合。3%以上が高配当とされています。株価が上がると利回りは下がります。',
  },
  payoutRatio: {
    definition: '当期純利益のうち配当として支払った割合。20〜50%が安定的な配当を維持しやすいとされています。',
  },
  per: {
    definition: '株価収益率。株価が1株当たり利益の何倍かを示します。15倍以下が割安、20倍超は割高の目安です。',
  },
  pbr: {
    definition: '株価純資産倍率。株価が1株当たり純資産の何倍かを示します。1倍以下は資産価値以下での取引を意味します。',
  },
}

// AIスコア各項目の定義テキスト
export const SCORE_DEFINITIONS: Record<string, MetricDefinition> = {
  financial: {
    definition: '自己資本比率・営業CF・負債比率から財務の安定性を評価します。満点25点。高いほど財務基盤が盤石です。',
  },
  growth: {
    definition: '売上・営業利益・EPSの成長率から企業の成長力を評価します。満点20点。長期保有には成長性が重要です。',
  },
  profitability: {
    definition: 'ROE・ROA・営業利益率から収益効率を評価します。満点15点。高いほど資本を効率よく活用しています。',
  },
  shareholder: {
    definition: '配当利回りと配当性向から株主還元の充実度を評価します。満点10点。安定した配当が継続されているか確認します。',
  },
  valuation: {
    definition: 'PERとPBRから株価の割安・割高度を評価します。満点10点。低いほど相対的に割安な水準です。',
  },
  technical: {
    definition: 'トレンド・RSI・MACDの3指標から直近の株価動向を評価します。満点10点。直近の買いタイミング判断に使います。',
  },
  longTermStability: {
    definition: 'Yahoo Financeから取得できる過去最大5年の業績から景気サイクルを通じた安定性を評価します。満点10点。赤字年数が少なく、最悪期でも利益を維持できた企業が高得点です。',
  },
}

// 下落理由分析の定義テキスト
export const DECLINE_DEFINITIONS: Record<string, MetricDefinition> = {
  market: {
    definition: '日経平均など市場全体の動きと連動した下落。個別銘柄の問題ではなく、相場全体の調整や外部ショックが原因です。',
  },
  sector: {
    definition: '同業他社や業界全体に共通した下落。規制変更・原材料価格・業界サイクルなどが要因として考えられます。',
  },
  company: {
    definition: '決算ミス・不祥事・経営戦略の変更など、その企業固有の一時的な要因による下落。業績改善で回復する可能性があります。',
  },
  structural: {
    definition: 'ビジネスモデルの陳腐化・競争力の喪失など、長期的・構造的な問題による下落。回復には抜本的な変革が必要です。',
  },
  isTemporary: {
    definition: '直近の下落が一時的か構造的かの総合判定。市場要因や一時的企業要因が主であれば「一時的」と判定されます。',
  },
}

// 期間文字列を "YYYY/MM/DD〜YYYY/MM/DD" 形式にフォーマット
function formatDate(dateStr: string): string {
  // "2024-04-01" → "2024/04/01"
  return dateStr.replace(/-/g, '/')
}

export function formatPeriod(period: { start: string; end: string }): string {
  return `${formatDate(period.start)}〜${formatDate(period.end)}`
}

export function getFinancialPeriodLabel(periodInfo?: PeriodInfo): string | undefined {
  if (!periodInfo?.financialPeriod) return undefined
  return formatPeriod(periodInfo.financialPeriod)
}

export function getStockPricePeriodLabel(periodInfo?: PeriodInfo): string | undefined {
  if (!periodInfo?.stockPricePeriod) return undefined
  return formatPeriod(periodInfo.stockPricePeriod)
}
