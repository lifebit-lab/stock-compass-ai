# Stock Compass AI — プロジェクトルール

## プロジェクト概要

日本株長期投資AIアナリストWebアプリ。Phase 1はルールベース分析のみ（AI API不使用・0円）。

## 技術スタック

- Next.js 15 App Router + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Supabase（Database）
- J-Quants API（株価）+ EDINET API（財務）
- Recharts（チャート）

## 重要ルール

- APIキーは絶対にフロントエンドに露出しないこと（`NEXT_PUBLIC_` なし）
- 「投資助言ではなく判断材料の提供」である旨をフッターに常に表示すること
- J-Quants APIレート制限：1分間60リクエスト

## フォルダ規則

```
app/api/          APIルート（サーバーサイドのみ）
lib/              ビジネスロジック・外部APIクライアント
lib/utils/        計算ユーティリティ
components/stock/ 銘柄分析UIコンポーネント
components/screener/ スクリーニングUIコンポーネント
types/            TypeScript型定義
supabase/migrations/ DBマイグレーション
```

## 実装計画

詳細は `/Users/shimo/.claude/plans/claudecode-webapp-ai-prancy-lark.md` を参照。
