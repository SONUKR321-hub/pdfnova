import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import ProgressBar from '../../components/processor/ProgressBar'
import { compressPDF } from '../../lib/pdf-compress'
import { downloadBytes, formatSize } from '../../lib/pdf-utils'
import { useAppStore } from '../../store/useAppStore'

export default function CompressTool() {
  const { addToast } = useAppStore()
  const [file, setFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [compressedBytes, setCompressedBytes] = useState(null)

  // Compression Options
  const [mode, setMode] = useState('target') // 'target' | 'preset' | 'custom'
  const [targetSizeVal, setTargetSizeVal] = useState('200')
  const [targetUnit, setTargetUnit] = useState('KB') // 'KB' | 'MB'
  const [preset, setPreset] = useState('recommended') // 'extreme' | 'recommended' | 'low'

  // Advanced Custom Controls
  const [customQuality, setCustomQuality] = useState(60)
  const [customScale, setCustomScale] = useState(1.2)
  const [grayscale, setGrayscale] = useState(false)
  const [stripMeta, setStripMeta] = useState(true)

  const fileInputRef = useRef(null)

  const handleFile = (f) => {
    if (!f || f.type !== 'application/pdf') {
      addToast('Please select a valid PDF file.', 'error')
      return
    }
    setFile(f)
    setCompressedBytes(null)

    // Suggest a reasonable target size based on original size
    const originalKB = Math.round(f.size / 1024)
    if (originalKB > 1000) {
      setTargetSizeVal(Math.round(originalKB * 0.3).toString())
      setTargetUnit('KB')
    } else {
      setTargetSizeVal(Math.max(50, Math.round(originalKB * 0.5)).toString())
      setTargetUnit('KB')
    }
  }

  const handleCompress = async () => {
    if (!file) return

    setProcessing(true)
    setProgress(0)
    setStatusText('Preparing document…')

    try {
      let targetSizeKB = null
      if (mode === 'target') {
        const val = parseFloat(targetSizeVal)
        if (!Number.isFinite(val) || val <= 0) {
          addToast('Enter a target size greater than 0.', 'error')
          return
        }
        targetSizeKB = targetUnit === 'MB' ? val * 1024 : val
      }

      const options = {
        mode: mode === 'target' ? 'target' : mode === 'preset' ? preset : 'custom',
        targetSizeKB,
        quality: mode === 'custom' ? customQuality / 100 : undefined,
        dpiScale: mode === 'custom' ? customScale : undefined,
        grayscale,
        stripMetadata: stripMeta,
      }

      const bytes = await compressPDF(file, options, (pct, msg) => {
        setProgress(pct)
        setStatusText(msg)
      })

      setCompressedBytes(bytes)
      const targetBytes = targetSizeKB ? targetSizeKB * 1024 : null
      if (targetBytes && bytes.byteLength > targetBytes) {
        addToast('Compression completed, but this PDF could not reach the requested size without further quality loss.', 'info')
      } else {
        addToast('Document compressed successfully!', 'success')
      }
    } catch (err) {
      console.error(err)
      addToast(err.message || 'Error compressing PDF.', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!compressedBytes || !file) return
    downloadBytes(compressedBytes, `compressed_${file.name}`)
  }

  const handleReset = () => {
    setFile(null)
    setCompressedBytes(null)
    setProgress(0)
  }

  const originalSizeFormatted = file ? formatSize(file.size) : '0 B'
  const compressedSizeFormatted = compressedBytes ? formatSize(compressedBytes.byteLength) : '0 B'
  const reductionPercent = (file && compressedBytes)
    ? Math.max(0, Math.round(((file.size - compressedBytes.byteLength) / file.size) * 100))
    : 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text mb-4 transition-colors">
          <Icon name="ArrowRight" size={13} className="rotate-180" />
          <span>Back to All Tools</span>
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#B58A4A] text-white flex items-center justify-center shadow-sm">
              <Icon name="Minimize2" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-text">Compress PDF Size</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-accent/15 text-accent-text border border-accent/25 px-2 py-0.5 rounded-pill">
                  Custom KB/MB
                </span>
              </div>
              <p className="text-xs sm:text-sm text-text-muted mt-0.5">
                Reduce PDF file size to your exact target KB or MB with 100% in-browser processing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── SCREEN 1: DROPZONE IF NO FILE ── */}
      {!file && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const dropped = e.dataTransfer.files?.[0]
            if (dropped) handleFile(dropped)
          }}
          className="p-12 border-2 border-dashed border-border hover:border-accent/60 bg-surface rounded-2xl text-center cursor-pointer transition-all hover:bg-surface-elevated shadow-sm"
        >
          <div className="w-16 h-16 rounded-2xl bg-accent-subtle text-accent flex items-center justify-center mx-auto mb-4">
            <Icon name="Minimize2" size={32} />
          </div>
          <h2 className="text-lg font-bold text-text mb-1">Choose or drop your PDF to compress</h2>
          <p className="text-xs text-text-muted mb-6">
            Supports all PDF sizes • Specify custom KB/MB • No upload to cloud
          </p>
          <button
            type="button"
            className="px-6 py-2.5 rounded-pill text-sm font-semibold bg-accent text-white shadow-sm hover:bg-accent/90 transition-all inline-flex items-center gap-2"
          >
            <Icon name="Folder" size={16} />
            <span>Select PDF File</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      )}

      {/* ── SCREEN 2: COMPRESSION CONTROLS & CUSTOMIZATION ── */}
      {file && !compressedBytes && !processing && (
        <div className="space-y-6">
          {/* File summary card */}
          <div className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-subtle text-accent flex items-center justify-center font-bold text-sm">
                PDF
              </div>
              <div>
                <div className="text-sm font-semibold text-text truncate max-w-sm">{file.name}</div>
                <div className="text-xs text-text-muted">
                  Original Size: <strong className="text-text">{originalSizeFormatted}</strong>
                </div>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="text-xs text-text-muted hover:text-danger border border-border px-3 py-1.5 rounded-pill transition-colors"
            >
              Change file
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                Compression Method
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('target')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    mode === 'target'
                      ? 'bg-accent-subtle border-accent text-accent-text font-semibold shadow-sm'
                      : 'bg-bg-alt/50 border-border text-text hover:bg-bg-alt'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">🎯</span>
                    <span className="text-sm">Target Size (KB/MB)</span>
                  </div>
                  <p className="text-xs text-text-muted font-normal">
                    Compress to exact size (e.g. under 200 KB)
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('preset')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    mode === 'preset'
                      ? 'bg-accent-subtle border-accent text-accent-text font-semibold shadow-sm'
                      : 'bg-bg-alt/50 border-border text-text hover:bg-bg-alt'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">⚡</span>
                    <span className="text-sm">Quick Presets</span>
                  </div>
                  <p className="text-xs text-text-muted font-normal">
                    Extreme, Recommended, or Low compression
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('custom')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    mode === 'custom'
                      ? 'bg-accent-subtle border-accent text-accent-text font-semibold shadow-sm'
                      : 'bg-bg-alt/50 border-border text-text hover:bg-bg-alt'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">⚙️</span>
                    <span className="text-sm">Manual Tuning</span>
                  </div>
                  <p className="text-xs text-text-muted font-normal">
                    Adjust DPI resolution &amp; quality slider
                  </p>
                </button>
              </div>
            </div>

            {/* ── TAB 1: TARGET SIZE CUSTOMIZATION ── */}
            {mode === 'target' && (
              <div className="space-y-4 pt-2 border-t border-border/70">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-sm font-semibold text-text">
                    Specify Target Output Size:
                  </label>
                  <span className="text-xs text-text-muted">
                    Ideal for portal upload limits (e.g. 200 KB)
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-xs">
                    <input
                      type="number"
                      min="10"
                      max="100000"
                      value={targetSizeVal}
                      onChange={(e) => setTargetSizeVal(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg-alt text-text text-base font-semibold outline-none focus:border-accent"
                      placeholder="e.g. 200"
                    />
                  </div>

                  <select
                    value={targetUnit}
                    onChange={(e) => setTargetUnit(e.target.value)}
                    className="px-4 py-2.5 rounded-lg border border-border bg-bg-alt text-text font-semibold text-sm outline-none focus:border-accent cursor-pointer"
                  >
                    <option value="KB">Kilobytes (KB)</option>
                    <option value="MB">Megabytes (MB)</option>
                  </select>
                </div>

                {/* Popular Shortcut Pills */}
                <div>
                  <div className="text-xs text-text-muted mb-2 font-medium">Quick Target Presets:</div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Under 100 KB', val: '100', unit: 'KB' },
                      { label: 'Under 200 KB (Govt Portals)', val: '200', unit: 'KB' },
                      { label: 'Under 500 KB', val: '500', unit: 'KB' },
                      { label: 'Under 1 MB', val: '1', unit: 'MB' },
                      { label: 'Under 2 MB', val: '2', unit: 'MB' },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => {
                          setTargetSizeVal(btn.val)
                          setTargetUnit(btn.unit)
                        }}
                        className={`text-xs px-3 py-1.5 rounded-pill border transition-colors ${
                          targetSizeVal === btn.val && targetUnit === btn.unit
                            ? 'bg-accent text-white border-accent font-semibold'
                            : 'bg-bg-alt text-text-secondary border-border hover:text-text hover:bg-surface'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: PRESETS ── */}
            {mode === 'preset' && (
              <div className="space-y-3 pt-2 border-t border-border/70">
                {[
                  {
                    id: 'extreme',
                    title: 'Extreme Compression',
                    sub: 'Smallest possible file size (~75-90% reduction). Best for strict upload size limits.',
                    icon: '🔥',
                  },
                  {
                    id: 'recommended',
                    title: 'Recommended / Balanced',
                    sub: 'High compression with sharp text and clear graphics (~50-70% reduction).',
                    icon: '⭐',
                  },
                  {
                    id: 'low',
                    title: 'Low Compression',
                    sub: 'Highest visual quality with minor reduction (~20-40% reduction).',
                    icon: '💎',
                  },
                ].map((p) => (
                  <label
                    key={p.id}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      preset === p.id
                        ? 'bg-accent/10 border-accent text-text'
                        : 'bg-bg-alt/30 border-border text-text hover:bg-bg-alt/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="preset"
                      checked={preset === p.id}
                      onChange={() => setPreset(p.id)}
                      className="mt-1 accent-accent"
                    />
                    <div>
                      <div className="text-sm font-semibold flex items-center gap-1.5">
                        <span>{p.icon}</span>
                        <span>{p.title}</span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">{p.sub}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* ── TAB 3: MANUAL TUNING ── */}
            {mode === 'custom' && (
              <div className="space-y-5 pt-2 border-t border-border/70">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-text">Image Quality: {customQuality}%</span>
                    <span className="text-text-muted">Lower = smaller file size</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="95"
                    value={customQuality}
                    onChange={(e) => setCustomQuality(+e.target.value)}
                    className="w-full accent-accent cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-text">
                      Resolution Scaling: {Math.round(customScale * 100)}%
                    </span>
                    <span className="text-text-muted">Downscales DPI</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.8"
                    step="0.1"
                    value={customScale}
                    onChange={(e) => setCustomScale(+e.target.value)}
                    className="w-full accent-accent cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Extra Options (Grayscale & Metadata) */}
            <div className="pt-4 border-t border-border/60 flex flex-wrap gap-6 text-xs text-text">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={grayscale}
                  onChange={(e) => setGrayscale(e.target.checked)}
                  className="rounded accent-accent"
                />
                <span className="font-medium">Black &amp; White (Grayscale Mode)</span>
                <span className="text-text-muted text-[11px]">— Huge size savings for scanned text</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stripMeta}
                  onChange={(e) => setStripMeta(e.target.checked)}
                  className="rounded accent-accent"
                />
                <span className="font-medium">Strip Metadata &amp; Thumbnails</span>
              </label>
            </div>
          </div>

          {/* Compress Action Button */}
          <button
            type="button"
            onClick={handleCompress}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-accent hover:bg-accent/90 shadow-md transition-all text-sm flex items-center justify-center gap-2"
          >
            <span>🗜 Compress PDF Now</span>
            {mode === 'target' && targetSizeVal && (
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                (Target: {targetSizeVal} {targetUnit})
              </span>
            )}
          </button>
        </div>
      )}

      {/* ── SCREEN 3: PROGRESS ── */}
      {processing && (
        <div className="p-8 rounded-2xl bg-surface border border-border shadow-sm">
          <ProgressBar progress={progress} statusText={statusText} />
        </div>
      )}

      {/* ── SCREEN 4: SUCCESS RESULT CARD ── */}
      {compressedBytes && file && (
        <div className="p-8 rounded-2xl bg-surface border border-border shadow-md space-y-6 text-center animate-scale-up">
          <div className="w-16 h-16 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>

          <div>
            <h2 className="text-2xl font-bold text-text mb-1">Compression Complete!</h2>
            <p className="text-xs text-text-muted">
              {file.name} has been optimized and is ready for download.
            </p>
          </div>

          {/* Before vs After Size Stats */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto p-4 rounded-xl bg-bg-alt border border-border text-center">
            <div>
              <div className="text-xs text-text-muted mb-1">Original Size</div>
              <div className="text-base font-bold text-text">{originalSizeFormatted}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted mb-1">Compressed Size</div>
              <div className="text-base font-bold text-success">{compressedSizeFormatted}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted mb-1">Reduction</div>
              <div className="text-base font-bold text-accent">−{reductionPercent}%</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleDownload}
              className="px-8 py-3 rounded-pill font-bold text-white bg-accent hover:bg-accent/90 shadow-sm transition-all text-sm flex items-center gap-2"
            >
              <Icon name="Download" size={16} />
              <span>Download Compressed PDF ({compressedSizeFormatted})</span>
            </button>

            <button
              type="button"
              onClick={() => setCompressedBytes(null)}
              className="px-5 py-3 rounded-pill font-semibold text-text-secondary bg-surface hover:bg-bg-alt border border-border transition-all text-xs"
            >
              Adjust Settings &amp; Compress Again
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-3 rounded-pill font-semibold text-text-secondary bg-surface hover:bg-bg-alt border border-border transition-all text-xs"
            >
              Compress Another PDF
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
