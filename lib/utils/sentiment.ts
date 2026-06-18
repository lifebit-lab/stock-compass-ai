const POSITIVE = [
  'profit', 'growth', 'record', 'beat', 'upgrade', 'raises guidance', 'acquisition',
  'dividend', 'strong', 'surge', 'rally', 'gain', 'rise', 'expands', 'boosts',
]

const NEGATIVE = [
  'loss', 'decline', 'miss', 'downgrade', 'recall', 'fraud', 'lawsuit',
  'investigation', 'restructuring', 'cuts', 'warning', 'drops', 'falls',
  'slumps', 'plunges', 'downturn', 'bankruptcy', 'scandal',
]

export function analyzeSentiment(title: string): 'positive' | 'negative' | 'neutral' {
  const lower = title.toLowerCase()
  const isPositive = POSITIVE.some(w => lower.includes(w))
  const isNegative = NEGATIVE.some(w => lower.includes(w))
  if (isPositive && !isNegative) return 'positive'
  if (isNegative && !isPositive) return 'negative'
  return 'neutral'
}
