# 実装計画: 各指標の定義・期間ツールチップ機能

作成日: 2026-06-13
参照PRD: `.claude/plans/prd-tooltip-definition-period-2026-06-13.md`

## 実装順序の方針

依存関係: 型定義 → APIデータ拡張 → 共通UIコンポーネント → 定義テキスト → 各セクションへの適用

- Tooltipは shadcn/ui に未導入のため、軽量なカスタムコンポーネントを作成する
- FinancialScore・DeclineAnalysis はServer Component。クリック操作が必要なため 'use client' への変換が必要
- ScoreCard はすでに 'use client' 済み

---

## フェーズ1: 型定義・期間データの拡張

### Step 1-1: PeriodInfo 型を追加
- やること: `types/analysis.ts` に `PeriodInfo` 型を追加、`StockAnalysis` に `periodInfo` フィールドを追加
- 使うファイル: `types/analysis.ts`
- 完了確認: `npx tsc --noEmit` でエラーなし

### Step 1-2: edinet.ts から期間を取得
- やること: `lib/edinet.ts` の `parseStatements` で `CurPerSt`/`CurPerEn` を抽出し `FinancialData` に `period` フィールドとして追加
- 使うファイル: `lib/edinet.ts`, `types/stock.ts`
- 完了確認: `/api/debug` で `fins_all_records` の `CurPerSt`/`CurPerEn` が取得できていること確認済み

### Step 1-3: APIレスポンスに periodInfo を追加
- やること: `app/api/stock/[code]/route.ts` で株価の日付範囲・財務期間を `periodInfo` としてレスポンスに追加
- 使うファイル: `app/api/stock/[code]/route.ts`
- 完了確認: `curl http://localhost:3001/api/stock/7203 | jq .periodInfo` で期間データが返ること

### Step 1-4: page.tsx から periodInfo を各コンポーネントに渡す
- やること: `app/stock/[code]/page.tsx` でAPIルートの代わりに直接計算した periodInfo を各コンポーネントのpropsに追加
- 使うファイル: `app/stock/[code]/page.tsx`
- 完了確認: `npx tsc --noEmit` でエラーなし

---

## フェーズ2: 共通ツールチップコンポーネント

### Step 2-1: InfoTooltip コンポーネントを作成
- やること: クリックで開閉する軽量ツールチップを `components/ui/InfoTooltip.tsx` に作成
  - 「？」アイコンボタン
  - クリックで吹き出し表示（定義 + 期間）
  - 外側クリックで閉じる
  - 画面端での左右反転対応
- 使うファイル: `components/ui/InfoTooltip.tsx`（新規）
- 完了確認: Storybookは不使用。page.tsx に仮配置して localhost で目視確認

---

## フェーズ3: 定義テキスト

### Step 3-1: 定義テキストファイルを作成
- やること: `lib/definitions.ts` に全指標の定義テキストを静的オブジェクトとして記述
  - 財務分析: 売上成長率・営業利益成長率・EPS成長率・自己資本比率・営業CF・ROE・ROA・営業利益率・配当利回り・配当性向・PER・PBR
  - AIスコア: 財務健全性・成長性・収益性・株主還元・割安性・テクニカル・総合
  - 下落理由: 市場要因・業界要因・一時的企業要因・構造的問題
- 使うファイル: `lib/definitions.ts`（新規）
- 完了確認: TypeScriptで型エラーなし

---

## フェーズ4: 各セクションへの適用

### Step 4-1: FinancialScore に「？」を追加
- やること:
  - `'use client'` を追加（periodInfo を props で受け取るため）
  - `MetricRow` に `definition`・`period` prop を追加
  - 各指標に `InfoTooltip` を組み込む
- 使うファイル: `components/stock/FinancialScore.tsx`
- 完了確認: localhost で財務分析の各指標に「？」が表示され、クリックで定義と期間が出る

### Step 4-2: ScoreCard に「？」を追加
- やること:
  - `ScoreItem` に `InfoTooltip` を組み込む
  - 各スコア項目（財務健全性・成長性・収益性・株主還元・割安性・テクニカル）に追加
- 使うファイル: `components/stock/ScoreCard.tsx`
- 完了確認: localhost で各スコアバーに「？」が表示され、定義と期間が出る

### Step 4-3: DeclineAnalysis に「？」を追加
- やること:
  - `'use client'` を追加
  - セクションタイトル横と各原因項目に `InfoTooltip` を組み込む
  - 期間は株価データの日付範囲（periodInfo.stockPricePeriod）を使用
- 使うファイル: `components/stock/DeclineAnalysis.tsx`
- 完了確認: localhost で下落理由分析に「？」が表示され、定義と期間が出る

---

## フェーズ5: 品質確認・デプロイ

- [ ] 型チェック: `npx tsc --noEmit`
- [ ] Lint: `npm run lint`
- [ ] ビルド確認: `npm run build`
- [ ] 動作確認: 7203（トヨタ）で全セクションのツールチップを目視確認
- [ ] `/deployment-review` でデプロイ前チェック

---

## リスク・注意点

- `FinancialScore` と `DeclineAnalysis` は Server Component のため、`'use client'` 追加が必要
- ツールチップのクリック外閉じには `useEffect` + `document.addEventListener` が必要（SSRでは動かないため Client Component 必須）
- `CurPerSt` が null の場合（APIが返さない場合）のフォールバック表示を必ず実装する

## 今回スコープ外（次回以降）

- 投資スタイル判定セクションへのツールチップ追加
- ツールチップ内容の管理画面編集
