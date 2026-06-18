import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink, FileText, Bell, Globe, BookOpen } from 'lucide-react'

interface Props {
  code: string
  irWebsite?: string
}

export function IRLinks({ code, irWebsite }: Props) {
  const edinetUrl = `https://disclosure2.edinet-fsa.go.jp/`
  const tdnetUrl = `https://www.release.tdnet.info/`

  const shashiUrl = `https://the-shashi.com/tse/${code}/`

  const links = [
    {
      icon: FileText,
      label: '有価証券報告書',
      sub: 'EDINET',
      href: edinetUrl,
    },
    {
      icon: Bell,
      label: '適時開示情報',
      sub: 'TDnet',
      href: tdnetUrl,
    },
    {
      icon: BookOpen,
      label: '企業の歴史を読む',
      sub: 'The社史',
      href: shashiUrl,
    },
    ...(irWebsite
      ? [{
          icon: Globe,
          label: 'IR公式サイト',
          sub: irWebsite.replace(/^https?:\/\//, '').split('/')[0]
            + (!irWebsite.includes('.co.jp') ? ' (グローバル)' : ''),
          href: irWebsite,
        }]
      : []),
  ]

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-emerald-500" />
          IR・開示資料
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="divide-y divide-border/60">
          {links.map(({ icon: Icon, label, sub, href }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 py-2.5 group hover:text-emerald-600 transition-colors"
            >
              <Icon className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-emerald-500 transition-colors" />
              <span className="flex-1 text-sm">{label}</span>
              <span className="text-xs text-muted-foreground">{sub}</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
