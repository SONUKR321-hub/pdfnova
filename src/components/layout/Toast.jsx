import React from 'react'
import { useAppStore } from '../../store/useAppStore'
import Icon from '../ui/Icon'

export default function Toast() {
  const { toasts, removeToast } = useAppStore()

  if (!toasts.length) return null

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type || 'info'}`}>
          <Icon
            name={t.type === 'success' ? 'Check' : t.type === 'error' ? 'X' : 'Info'}
            size={18}
            className={
              t.type === 'success'
                ? 'text-[#6F8F7A]'
                : t.type === 'error'
                ? 'text-[#B65C52]'
                : 'text-[#B58A4A]'
            }
          />
          <span className="flex-1 text-sm font-medium">{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="text-text-muted hover:text-text transition-colors p-1"
            aria-label="Dismiss"
          >
            <Icon name="X" size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
