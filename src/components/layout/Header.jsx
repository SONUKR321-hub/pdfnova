import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import Icon from '../ui/Icon'
import { ALL_TOOLS, INTENTS } from '../../constants/tools'

export default function Header() {
  const { theme, toggleTheme } = useAppStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const filteredTools = query.trim()
    ? ALL_TOOLS.filter(
        t =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.desc.toLowerCase().includes(query.toLowerCase()) ||
          t.intent.toLowerCase().includes(query.toLowerCase())
      )
    : []

  const handleSelectTool = (route) => {
    setSearchOpen(false)
    setToolsOpen(false)
    setActiveCategory(null)
    setQuery('')
    navigate(route)
  }

  const groupedTools = INTENTS.slice(1)
    .filter(intent => !activeCategory || intent === activeCategory)
    .map((intent) => ({
    intent,
    tools: ALL_TOOLS.filter(tool => tool.intent === intent),
    }))

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Icon name="FileText" size={20} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-2xl font-bold tracking-tight text-text leading-none">
                PDFNova
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider bg-accent/15 text-accent-text border border-accent/25 px-1.5 py-0.2 rounded">
                PRO FREE
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mt-0.5">
              Free • Unlimited • No Sign-up
            </span>
          </div>
        </Link>

        {/* Global Search Bar */}
        <div className="relative flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Icon
              name="File"
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSearchOpen(true)
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search tools (e.g. Merge, Compress, Sign, Protect)..."
              className="w-full pl-9 pr-8 py-2 bg-bg-alt/70 hover:bg-bg-alt focus:bg-surface border border-border focus:border-border-focus rounded-pill text-sm text-text placeholder:text-text-muted outline-none transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
              >
                <Icon name="X" size={14} />
              </button>
            )}
          </div>

          {/* Quick Search Dropdown */}
          {searchOpen && query.trim() && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setSearchOpen(false)}
              />
              <div className="absolute left-0 right-0 top-full mt-2 bg-surface-elevated border border-border rounded-lg shadow-lg overflow-hidden z-20 max-h-80 overflow-y-auto animate-fade-in">
                {filteredTools.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {filteredTools.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => handleSelectTool(tool.route)}
                        className="w-full flex items-center justify-between p-2 rounded-md hover:bg-bg-alt text-left transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-7 h-7 rounded flex items-center justify-center text-white"
                            style={{ backgroundColor: tool.color }}
                          >
                            <Icon name={tool.icon} size={15} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-text group-hover:text-accent transition-colors">
                              {tool.name}
                            </div>
                            <div className="text-xs text-text-muted truncate max-w-xs">
                              {tool.desc}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-pill bg-bg-alt text-text-muted border border-border">
                          {tool.intent}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-text-muted">
                    No matching tools found.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <span className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold text-success bg-success/10 border border-success/20 px-3 py-1.5 rounded-pill">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            No Sign-up • 100% Free
          </span>

          <Link
            to="/tool/merge"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-medium bg-accent-subtle hover:bg-accent-subtle-hover text-accent-text border border-accent/20 transition-all"
          >
            <Icon name="GitMerge" size={14} />
            <span>Quick Merge</span>
          </Link>

          <button
            onClick={toggleTheme}
            aria-label="Toggle dark/light theme"
            className="w-9 h-9 rounded-pill border border-border flex items-center justify-center text-text-secondary hover:text-text hover:bg-bg-alt transition-colors"
          >
            <Icon name={theme === 'dark' ? 'Sun' : 'Moon'} size={18} />
          </button>
        </div>
      </div>

      {/* Top-level tool navigation */}
      <div className="border-t border-border/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-11 flex items-center gap-2 overflow-visible">
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveCategory(null)
                setToolsOpen(open => !open)
              }}
              aria-expanded={toolsOpen}
              aria-haspopup="true"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-bold transition-colors ${
                toolsOpen
                  ? 'bg-accent text-white'
                  : 'bg-accent-subtle text-accent-text hover:bg-accent-subtle-hover'
              }`}
            >
              <Icon name="LayoutGrid" size={14} />
              <span>All Features</span>
              <Icon name={toolsOpen ? 'ChevronUp' : 'ChevronDown'} size={13} />
            </button>

            {toolsOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close features menu"
                  className="fixed inset-0 w-full h-full cursor-default"
                  onClick={() => setToolsOpen(false)}
                />
                <div className="absolute left-0 top-full mt-2 w-[min(860px,calc(100vw-2rem))] p-4 sm:p-5 bg-surface-elevated border border-border rounded-2xl shadow-lg z-50 animate-fade-in">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <h2 className="text-sm font-bold text-text">
                        {activeCategory ? `${activeCategory} tools` : 'All PDFNova features'}
                      </h2>
                      <p className="text-xs text-text-muted mt-0.5">Choose a tool to get started instantly.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setToolsOpen(false)}
                      className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-bg-alt"
                      aria-label="Close features menu"
                    >
                      <Icon name="X" size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[min(65vh,520px)] overflow-y-auto pr-1">
                    {groupedTools.map(({ intent, tools }) => (
                      <div key={intent} className="p-2 rounded-xl bg-bg-alt/50 border border-border/70">
                        <div className="flex items-center gap-1.5 px-2 pb-1.5 text-[10px] uppercase tracking-wider font-bold text-text-muted">
                          <span>{intent}</span>
                          <span className="text-[9px] font-normal">({tools.length})</span>
                        </div>
                        <div className="space-y-0.5">
                          {tools.map(tool => (
                            <Link
                              key={tool.id}
                              to={tool.route}
                              onClick={() => setToolsOpen(false)}
                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface text-text transition-colors group"
                            >
                              <span
                                className="w-7 h-7 shrink-0 rounded-md flex items-center justify-center text-white"
                                style={{ backgroundColor: tool.color }}
                              >
                                <Icon name={tool.icon} size={14} />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-xs font-semibold truncate group-hover:text-accent transition-colors">
                                  {tool.name}
                                </span>
                                {tool.badge && (
                                  <span className="text-[9px] text-accent-text">{tool.badge}</span>
                                )}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <nav aria-label="Tool categories" className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
            {INTENTS.slice(1).map(intent => (
              <button
                key={intent}
                type="button"
                onClick={() => {
                  setActiveCategory(intent)
                  setToolsOpen(true)
                }}
                className="px-2.5 py-1.5 rounded-pill text-xs text-text-secondary hover:text-accent-text hover:bg-accent-subtle transition-colors"
              >
                {intent}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
