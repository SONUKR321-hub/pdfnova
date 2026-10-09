import React from 'react'
import Icon from '../ui/Icon'

export default function ProgressBar({ progress, statusText }) {
  return (
    <div className="w-full bg-surface-elevated border border-border p-6 rounded-lg shadow-sm animate-fade-in">
      <div className="flex items-center justify-between text-sm mb-2.5">
        <span className="font-medium text-text flex items-center gap-2">
          <Icon name="RefreshCw" size={16} className="animate-spin text-accent" />
          {statusText || 'Processing document...'}
        </span>
        <span className="font-semibold text-accent">{progress}%</span>
      </div>

      <div className="w-full h-2.5 bg-bg-alt rounded-pill overflow-hidden relative">
        <div
          className="h-full bg-accent rounded-pill transition-all duration-300 relative progress-shimmer"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  )
}
