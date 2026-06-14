# Stock Compass AI — Design System

## Overall Direction
- スタイル: Data-first Minimal / Professional Finance
- 用途: 株式分析ダッシュボード
- モード: Light first
- 一言で: 「Bloomberg + みんかぶのような、情報密度が高いが読みやすいプロ向けUI」

## Typography
- フォント: システムフォント（UI Font Stack）— Inter等の明示的指定なし
- 数値セル: `tabular-nums` で桁揃え必須
- サイズスケール: 12 / 13 / 14 / 16 / 18 / 24px

## Color Palette
### Light mode
- Background: #f9fafb (gray-50、純白を避ける)
- Surface: #ffffff
- Border: #e5e7eb (gray-200)
- Text primary: #111827 (gray-900)
- Text secondary: #6b7280 (gray-500)
- Accent: #059669 (emerald-600)
- Positive: #16a34a (green-600) — ＋記号とセット
- Negative: #dc2626 (red-600) — ▲記号とセット

## Data Presentation Rules
- 金額: 億円単位に変換（`/ 1e8` → `toLocaleString`）
- 成長率: `＋X.X%` (green) / `▲X.X%` (red)
- 欠損値: "---" で表示
- 数値セルには必ず `tabular-nums` を適用
- 赤字（マイナス純利益等）: 数値に `▲` prefix + red

## Spacing
- Scale: 4 / 8 / 12 / 16 / 24 / 32 / 48px
- Border radius: 6px (card), 4px (badge)
- Shadow: subtle のみ（0 1px 2px rgba(0,0,0,.06)）

## Prohibited
- Inter フォントの明示的指定（システムフォントに任せる）
- 紫・グラデーション多用
- 全カードに同じ shadow-md
- hover:scale-105 を全要素に付ける
- 純粋な #ffffff の単体背景（gray-50 を使う）
- 意味のないアニメーション

## References
- https://the-shashi.com/tse/4755/current/
- 「Bloomberg Terminal + 日本語IRサイトの情報密度」
