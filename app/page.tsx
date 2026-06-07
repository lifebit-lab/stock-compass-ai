import { SearchForm } from '@/components/stock/SearchForm'
import { TrendingUp, Shield, BarChart3, Search } from 'lucide-react'

const features = [
  {
    icon: TrendingUp,
    title: '下落理由を自動判定',
    description: '市場全体の調整なのか、企業固有の問題なのかをルールベースで分類します',
  },
  {
    icon: Shield,
    title: '即除外フィルター',
    description: '3年連続減収・営業CFマイナス・自己資本比率20%未満など博打銘柄を自動除外',
  },
  {
    icon: BarChart3,
    title: '100点満点スコアリング',
    description: '財務健全性・成長性・収益性・テクニカルを統合した総合スコアを算出',
  },
  {
    icon: Search,
    title: 'スクリーニング機能',
    description: 'ROE・PER・配当利回りなど複数条件で優良銘柄を絞り込めます',
  },
]

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* ヒーロー */}
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">
          長期保有できる優良銘柄を発見する
          <span className="text-emerald-500">AIアナリスト</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
          銘柄コードを入力するだけで、財務・テクニカル・下落理由を自動分析。
          博打銘柄を避け、10年後も成長できる企業を見つけます。
        </p>
        <SearchForm />
        <p className="text-xs text-muted-foreground mt-3">
          例：7203（トヨタ）、9984（ソフトバンクG）、6758（ソニー）
        </p>
      </div>

      {/* 特徴 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map(f => (
          <div key={f.title} className="rounded-xl border border-border p-5 hover:border-emerald-200 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <f.icon className="h-4 w-4 text-emerald-600" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{f.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
