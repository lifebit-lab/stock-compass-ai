'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'

export function Header() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: '銘柄分析' },
    { href: '/screener', label: 'スクリーニング' },
  ]

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <TrendingUp className="h-5 w-5 text-emerald-500" />
          <span>Stock Compass AI</span>
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm transition-colors',
                pathname === item.href
                  ? 'bg-muted font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
