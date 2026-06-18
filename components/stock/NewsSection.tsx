import { Newspaper, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { StockNewsItem } from '@/lib/yahoo-finance'

interface Props {
  news: StockNewsItem[]
}

function sentimentBadge(s: StockNewsItem['sentiment']) {
  if (s === 'positive') return <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 shrink-0">ポジティブ</span>
  if (s === 'negative') return <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 shrink-0">ネガティブ</span>
  return <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 shrink-0">ニュートラル</span>
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return '今日'
  if (days === 1) return '1日前'
  return `${days}日前`
}

export function NewsSection({ news }: Props) {
  if (!news || news.length === 0) {
    return (
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-emerald-500" />
            最新ニュース
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">ニュースが見つかりませんでした</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-emerald-500" />
          最新ニュース
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="divide-y divide-border/60">
          {news.map((item, i) => (
            <div key={i} className="py-2.5 flex flex-col gap-1">
              <div className="flex items-start gap-2">
                {sentimentBadge(item.sentiment)}
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm leading-snug hover:text-emerald-600 hover:underline flex items-start gap-1 group"
                >
                  {item.title}
                  <ExternalLink className="h-3 w-3 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
              <p className="text-xs text-muted-foreground pl-1">
                {item.publisher} · {relativeDate(item.publishedAt)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
