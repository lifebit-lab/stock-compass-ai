import { NextResponse } from 'next/server'

interface StockItem {
  code: string
  name: string
}

// サーバーサイドキャッシュ（プロセス内 / 24時間）
let cache: StockItem[] | null = null
let cacheAt = 0

async function getStockList(): Promise<StockItem[]> {
  if (cache && Date.now() - cacheAt < 86400 * 1000) return cache

  const apiKey = process.env.JQUANTS_API_KEY
  if (!apiKey) return []

  const res = await fetch('https://api.jquants.com/v2/equities/master', {
    headers: { 'x-api-key': apiKey },
    next: { revalidate: 86400 },
  })
  if (!res.ok) return []

  const data = await res.json()
  const seen = new Set<string>()
  const items: StockItem[] = (data.data ?? [])
    .filter((s: Record<string, string>) => s.Code?.length === 5)
    .reduce((acc: StockItem[], s: Record<string, string>) => {
      const code = s.Code.slice(0, 4)
      if (!seen.has(code)) {
        seen.add(code)
        acc.push({ code, name: s.CoName ?? '' })
      }
      return acc
    }, [])

  cache = items
  cacheAt = Date.now()
  return items
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''

  if (q.length < 1) return NextResponse.json([])

  const stocks = await getStockList()

  const lower = q.toLowerCase()
  const results = stocks
    .filter(s =>
      s.code.startsWith(q) ||
      s.name.includes(q) ||
      s.name.toLowerCase().includes(lower)
    )
    .slice(0, 10)

  return NextResponse.json(results)
}
