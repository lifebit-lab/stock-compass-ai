import type { StockPrice } from '@/types/stock'
import type { TechnicalIndicators } from '@/types/analysis'

function sma(values: number[], period: number): number[] {
  const result: number[] = []
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(NaN)
      continue
    }
    const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
    result.push(sum / period)
  }
  return result
}

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1)
  const result: number[] = []
  let prev = NaN

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(NaN)
      continue
    }
    if (i === period - 1) {
      const init = values.slice(0, period).reduce((a, b) => a + b, 0) / period
      result.push(init)
      prev = init
      continue
    }
    const current = values[i] * k + prev * (1 - k)
    result.push(current)
    prev = current
  }
  return result
}

export function calcRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50

  let gains = 0
  let losses = 0

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff >= 0) gains += diff
    else losses += Math.abs(diff)
  }

  let avgGain = gains / period
  let avgLoss = losses / period

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    const gain = diff >= 0 ? diff : 0
    const loss = diff < 0 ? Math.abs(diff) : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
  }

  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

export function calcMACD(closes: number[]): { macd: number[]; signal: number[]; histogram: number[] } {
  const ema12 = ema(closes, 12)
  const ema26 = ema(closes, 26)

  const macdLine = ema12.map((v, i) =>
    isNaN(v) || isNaN(ema26[i]) ? NaN : v - ema26[i]
  )

  const validMacd = macdLine.filter(v => !isNaN(v))
  const signalRaw = ema(validMacd, 9)

  // signal を macdLine と同じ長さに揃える
  const offset = macdLine.length - validMacd.length
  const signal = Array(offset).fill(NaN).concat(signalRaw)
  const histogram = macdLine.map((v, i) =>
    isNaN(v) || isNaN(signal[i]) ? NaN : v - signal[i]
  )

  return { macd: macdLine, signal, histogram }
}

export function calcBollingerBands(closes: number[], period = 20, multiplier = 2): {
  upper: number[]
  middle: number[]
  lower: number[]
} {
  const middle = sma(closes, period)
  const upper: number[] = []
  const lower: number[] = []

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      upper.push(NaN)
      lower.push(NaN)
      continue
    }
    const slice = closes.slice(i - period + 1, i + 1)
    const mean = middle[i]
    const variance = slice.reduce((sum, v) => sum + (v - mean) ** 2, 0) / period
    const std = Math.sqrt(variance)
    upper.push(mean + multiplier * std)
    lower.push(mean - multiplier * std)
  }

  return { upper, middle, lower }
}

export function calcTechnicalIndicators(prices: StockPrice[]): TechnicalIndicators {
  if (prices.length === 0) {
    return {
      ma25: [],
      ma75: [],
      rsi: 50,
      macd: { macd: [], signal: [], histogram: [] },
      bollingerBands: { upper: [], middle: [], lower: [] },
      trend: 'sideways',
    }
  }

  const closes = prices.map(p => p.adjustedClose ?? p.close)

  const ma25 = sma(closes, 25)
  const ma75 = sma(closes, 75)
  const rsi = calcRSI(closes)
  const macd = calcMACD(closes)
  const bollingerBands = calcBollingerBands(closes)

  // トレンド判定
  const lastClose = closes[closes.length - 1]
  const lastMa25 = ma25[ma25.length - 1]
  const lastMa75 = ma75[ma75.length - 1]

  let trend: 'up' | 'down' | 'sideways' = 'sideways'
  if (!isNaN(lastMa25) && !isNaN(lastMa75)) {
    if (lastClose > lastMa25 && lastMa25 > lastMa75) trend = 'up'
    else if (lastClose < lastMa25 && lastMa25 < lastMa75) trend = 'down'
  }

  return { ma25, ma75, rsi, macd, bollingerBands, trend }
}

// 直近の下落率を計算（日数指定）
export function calcDeclineRate(prices: StockPrice[], days: number): number {
  if (prices.length < days + 1) return 0
  const recent = prices[prices.length - 1].close
  const base = prices[prices.length - 1 - days].close
  return ((recent - base) / base) * 100
}
