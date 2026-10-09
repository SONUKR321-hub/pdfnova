import React from 'react'
import Icon from '../ui/Icon'
import { formatSize } from '../../lib/pdf-utils'

export default function ResultCard({
  title = 'Your file is ready!',
  filename,
  fileSizeBytes,
  reductionPercent,
  onDownload,
  onReset,
  extraAction,
}) {
  return (
    <div className="w-full bg-surface-elevated border border-border p-6 sm:p-8 rounded-xl shadow-md text-center animate-fade-in">
      <div className="w-14 h-14 bg-success/15 border border-success/30 text-success rounded-full flex items-center justify-center mx-auto mb-4 animate-check-pop">
        <Icon name="Check" size={28} />
      </div>

      <h3 className="text-xl font-display font-bold text-text mb-1">{title}</h3>
      <p className="text-sm text-text-muted mb-6">
        File processed successfully with private client-side security.
      </p>

      <div className="bg-bg-alt/70 border border-border rounded-lg p-4 max-w-md mx-auto mb-6 text-left flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <Icon name="FileText" size={20} />
          </div>
          <div className="truncate">
            <p className="text-sm font-medium text-text truncate">{filename}</p>
            {fileSizeBytes !== undefined && (
              <p className="text-xs text-text-muted">
                {formatSize(fileSizeBytes)}
                {reductionPercent > 0 && (
                  <span className="ml-2 text-success font-semibold">
                    (-{reductionPercent}%)
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
        <button
          onClick={onDownload}
          className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent-text text-white font-medium text-sm rounded-pill shadow-sm transition-all"
        >
          <Icon name="Download" size={17} />
          <span>Download File</span>
        </button>

        {extraAction}

        <button
          onClick={onReset}
          className="w-full sm:w-auto px-5 py-3 border border-border bg-surface hover:bg-bg-alt text-text font-medium text-sm rounded-pill transition-colors"
        >
          Process Another
        </button>
      </div>
    </div>
  )
}
