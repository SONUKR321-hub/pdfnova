import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
  persist(
    (set, get) => ({
      // ── Theme ────────────────────────────────────────────
      theme: 'light',
      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light'
        document.documentElement.setAttribute('data-theme', next)
        set({ theme: next })
      },

      // ── Toast notifications ──────────────────────────────
      toasts: [],
      addToast: (message, type = 'info') => {
        const id = Date.now()
        set(s => ({ toasts: [...s.toasts, { id, message, type }] }))
        setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 4000)
      },
      removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

      // ── Recent files ─────────────────────────────────────
      recentFiles: [],
      addRecentFile: (file) =>
        set(s => ({
          recentFiles: [file, ...s.recentFiles.filter(f => f.name !== file.name)].slice(0, 5),
        })),

      // ── Active tool filter ───────────────────────────────
      activeIntent: 'All',
      setActiveIntent: (intent) => set({ activeIntent: intent }),
    }),
    {
      name: 'pdfnova-storage',
      partialize: (s) => ({ theme: s.theme, recentFiles: s.recentFiles }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          document.documentElement.setAttribute('data-theme', state.theme)
        }
      },
    }
  )
)
