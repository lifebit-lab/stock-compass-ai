import type { ExclusionWarning as ExclusionWarningType } from '@/types/analysis'
import { AlertTriangle } from 'lucide-react'

interface Props {
  exclusion: ExclusionWarningType
}

export function ExclusionWarning({ exclusion }: Props) {
  if (!exclusion.triggered) return null

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
        <AlertTriangle className="h-4 w-4" />
        長期投資候補から除外を推奨
      </div>
      <ul className="space-y-1">
        {exclusion.reasons.map((reason, i) => (
          <li key={i} className="text-sm text-red-600 flex items-start gap-1.5">
            <span className="mt-0.5">•</span>
            {reason}
          </li>
        ))}
      </ul>
    </div>
  )
}
