import React, { useRef, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'

const QUALITY_PRESETS = [
  { label: 'Maximum compression', value: 0.25 },
  { label: 'Recommended', value: 0.6 },
  { label: 'High quality', value: 0.85 },
  { label: 'Custom', value: null },
]

const SIZE_PRESETS = [
  { label: 'Passport photo', width: 413, height: 531, target: 200, unit: 'KB' },
  { label: 'Signature', width: 300, height: 100, target: 50, unit: 'KB' },
  { label: 'Form photo', width: 600, height: 600, target: 200, unit: 'KB' },
  { label: 'ID document', width: 1200, height: 800, target: 500, unit: 'KB' },
]

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Could not read ${file.name}`))
    }
    image.src = url
  })
}

function dataUrlBytes(dataUrl) {
  const base64 = dataUrl.split(',')[1]
  return Math.ceil((base64.length * 3) / 4)
}

function formatBytes(bytes) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`
}

export default function CompressImgTool() {
  const { addToast } = useAppStore()
  const [files, setFiles] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [qualityPreset, setQualityPreset] = useState(1)
  const [customQuality, setCustomQuality] = useState(70)
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [dimensionUnit, setDimensionUnit] = useState('px')
  const [dpi, setDpi] = useState('300')
  const [lockRatio, setLockRatio] = useState(true)
  const [targetSize, setTargetSize] = useState('200')
  const [targetUnit, setTargetUnit] = useState('KB')
  const [format, setFormat] = useState('jpg')
  const [rotation, setRotation] = useState(0)
  const [flip, setFlip] = useState('none')
  const [fitMode, setFitMode] = useState('crop')
  const [grayscale, setGrayscale] = useState(false)
  const [whiteBackground, setWhiteBackground] = useState(true)
  const [sourceRatio, setSourceRatio] = useState(null)
  const fileRef = useRef(null)

  const quality = qualityPreset === 3 ? customQuality / 100 : QUALITY_PRESETS[qualityPreset].value

  const unitToPixels = (value) => {
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) return 0
    if (dimensionUnit === 'in') return Math.round(numericValue * Number(dpi))
    if (dimensionUnit === 'cm') return Math.round(numericValue * Number(dpi) / 2.54)
    if (dimensionUnit === 'mm') return Math.round(numericValue * Number(dpi) / 25.4)
    return Math.round(numericValue)
  }

  const selectFiles = (list) => {
    const images = Array.from(list).filter(file => file.type.startsWith('image/'))
    if (!images.length) {
      addToast('Please choose JPG, PNG, WebP, GIF, or another image file.', 'error')
      return
    }
    setFiles(images)
    setResults([])
    loadImage(images[0]).then(image => {
      setSourceRatio(image.naturalWidth / image.naturalHeight)
      setWidth(String(image.naturalWidth))
      setHeight(String(image.naturalHeight))
    }).catch(error => addToast(error.message, 'error'))
  }

  const updateWidth = (value) => {
    setWidth(value)
    if (lockRatio && sourceRatio && value) setHeight(String(Math.max(1, Math.round(+value / sourceRatio))))
  }

  const updateHeight = (value) => {
    setHeight(value)
    if (lockRatio && sourceRatio && value) setWidth(String(Math.max(1, Math.round(+value * sourceRatio))))
  }

  const applyPreset = (preset) => {
    setDimensionUnit('px')
    setWidth(String(preset.width))
    setHeight(String(preset.height))
    setLockRatio(false)
    setTargetSize(String(preset.target))
    setTargetUnit(preset.unit)
    setFormat('jpg')
  }

  const renderImage = async (file, attemptQuality, attemptWidth, attemptHeight) => {
    const image = await loadImage(file)
    const angle = rotation * Math.PI / 180
    const rotated = rotation === 90 || rotation === 270
    const canvas = document.createElement('canvas')
    canvas.width = rotated ? attemptHeight : attemptWidth
    canvas.height = rotated ? attemptWidth : attemptHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Your browser cannot create an image canvas.')

    if (whiteBackground && format === 'jpg') {
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate(angle)
    ctx.scale(flip === 'horizontal' ? -1 : 1, flip === 'vertical' ? -1 : 1)
    ctx.filter = grayscale ? 'grayscale(100%)' : 'none'
    const sourceRatio = image.naturalWidth / image.naturalHeight
    const outputRatio = attemptWidth / attemptHeight
    let drawWidth = attemptWidth
    let drawHeight = attemptHeight
    if (fitMode === 'contain') {
      if (sourceRatio > outputRatio) drawHeight = attemptWidth / sourceRatio
      else drawWidth = attemptHeight * sourceRatio
    } else if (sourceRatio > outputRatio) {
      drawWidth = attemptHeight * sourceRatio
    } else {
      drawHeight = attemptWidth / sourceRatio
    }
    ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
    ctx.restore()

    const mime = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg'
    return canvas.toDataURL(mime, mime === 'image/png' ? 1 : attemptQuality)
  }

  const compress = async () => {
    if (!files.length) return
    const parsedWidth = unitToPixels(width)
    const parsedHeight = unitToPixels(height)
    const maxBytes = Math.max(1, (+targetSize || 0) * (targetUnit === 'MB' ? 1024 * 1024 : 1024))
    if (!parsedWidth || !parsedHeight || parsedWidth < 1 || parsedHeight < 1) {
      addToast('Enter valid output width and height.', 'error')
      return
    }
    if (dimensionUnit !== 'px' && (!Number.isFinite(+dpi) || +dpi <= 0)) {
      addToast('Enter a valid DPI value for physical dimensions.', 'error')
      return
    }
    if (!+targetSize || +targetSize <= 0) {
      addToast('Enter a target size greater than 0.', 'error')
      return
    }

    setLoading(true)
    setResults([])
    const output = []
    try {
      for (const file of files) {
        let attemptQuality = quality
        let attemptWidth = parsedWidth
        let attemptHeight = parsedHeight
        let dataUrl = ''

        for (let attempt = 0; attempt < 7; attempt++) {
          dataUrl = await renderImage(file, attemptQuality, attemptWidth, attemptHeight)
          const bytes = dataUrlBytes(dataUrl)
          if (format === 'png' || bytes <= maxBytes) break
          const ratio = Math.sqrt(maxBytes / bytes)
          attemptQuality = Math.max(0.08, attemptQuality * Math.max(0.55, ratio))
          if (attemptQuality <= 0.09 && bytes > maxBytes) {
            attemptWidth = Math.max(40, Math.floor(attemptWidth * Math.max(0.65, ratio)))
            attemptHeight = Math.max(40, Math.floor(attemptHeight * Math.max(0.65, ratio)))
          }
        }

        const bytes = dataUrlBytes(dataUrl)
        const ext = format === 'png' ? 'png' : format === 'webp' ? 'webp' : 'jpg'
        output.push({
          name: file.name,
          dataUrl,
          ext,
          bytes,
          originalBytes: file.size,
          w: attemptWidth,
          h: attemptHeight,
          meetsTarget: format === 'png' || bytes <= maxBytes,
        })
      }
      setResults(output)
      addToast(`Processed ${output.length} image(s) successfully.`, 'success')
    } catch (error) {
      addToast(error.message || 'Could not process the selected images.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const download = (result) => {
    const link = document.createElement('a')
    link.href = result.dataUrl
    link.download = `${result.name.replace(/\.[^.]+$/, '')}_form-ready.${result.ext}`
    link.click()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-text">Image Compressor &amp; Resizer</h1>
        <p className="text-sm text-text-muted mt-1">Prepare photos, signatures, and documents for online form uploads.</p>
      </div>

      <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-border space-y-6">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Form upload presets</div>
          <div className="flex flex-wrap gap-2">
            {SIZE_PRESETS.map(preset => (
              <button key={preset.label} type="button" onClick={() => applyPreset(preset)}
                className="px-3 py-2 rounded-lg border border-border bg-bg-alt text-xs font-semibold text-text hover:border-accent hover:text-accent-text transition-colors">
                {preset.label}
                <span className="block text-[10px] font-normal text-text-muted">{preset.width}×{preset.height}px · ≤{preset.target} {preset.unit}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 border-t border-border/70">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">Output dimensions</label>
              <select value={dimensionUnit} onChange={e => setDimensionUnit(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-border bg-bg-alt text-text text-xs font-semibold">
                <option value="px">Pixels (px)</option>
                <option value="in">Inches (in)</option>
                <option value="cm">Centimeters (cm)</option>
                <option value="mm">Millimeters (mm)</option>
              </select>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <input type="number" min="1" value={width} onChange={e => updateWidth(e.target.value)} placeholder="Width"
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg-alt text-text text-sm" />
              <span className="text-text-muted">×</span>
              <input type="number" min="1" value={height} onChange={e => updateHeight(e.target.value)} placeholder="Height"
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg-alt text-text text-sm" />
            </div>
            {dimensionUnit !== 'px' && (
              <label className="flex items-center gap-2 text-xs text-text">
                <span className="font-semibold whitespace-nowrap">Resolution (DPI)</span>
                <input type="number" min="72" max="1200" value={dpi} onChange={e => setDpi(e.target.value)}
                  className="w-24 px-2.5 py-1.5 rounded-lg border border-border bg-bg-alt text-text" />
              </label>
            )}
            <label className="flex items-center gap-2 text-xs text-text cursor-pointer">
              <input type="checkbox" checked={lockRatio} onChange={e => setLockRatio(e.target.checked)} className="accent-accent" />
              Keep original aspect ratio
            </label>
            <p className="text-[11px] text-text-muted">
              {dimensionUnit === 'px'
                ? 'Pixel dimensions are used directly, for example 413 × 531 px.'
                : `${dimensionUnit.toUpperCase()} values are converted to pixels using ${dpi || 0} DPI.`}
            </p>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">Maximum file size (KB / MB)</label>
            <div className="flex gap-2">
              <input type="number" min="1" value={targetSize} onChange={e => setTargetSize(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-bg-alt text-text text-sm" />
              <select value={targetUnit} onChange={e => setTargetUnit(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-bg-alt text-text text-sm">
                <option>KB</option><option>MB</option>
              </select>
            </div>
            <p className="text-[11px] text-text-muted">KB/MB is the downloaded file size. The tool retries quality and dimensions until the limit is reached.</p>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">Output format</label>
            <select value={format} onChange={e => setFormat(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg-alt text-text text-sm">
              <option value="jpg">JPG / JPEG (best for forms)</option>
              <option value="png">PNG (best for signatures/transparency)</option>
              <option value="webp">WebP (smallest modern format)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 border-t border-border/70">
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">Quality</label>
            {QUALITY_PRESETS.map((preset, index) => (
              <label key={preset.label} className="flex items-center gap-2 text-xs text-text cursor-pointer">
                <input type="radio" checked={qualityPreset === index} onChange={() => setQualityPreset(index)} className="accent-accent" />
                {preset.label}
              </label>
            ))}
            {qualityPreset === 3 && (
              <div className="flex items-center gap-3">
                <input type="range" min="5" max="100" value={customQuality} onChange={e => setCustomQuality(+e.target.value)} className="flex-1 accent-accent" />
                <span className="text-xs font-semibold text-text">{customQuality}%</span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">Editing options</label>
            <div className="flex flex-wrap gap-2">
              {[0, 90, 180, 270].map(angle => (
                <button key={angle} type="button" onClick={() => setRotation(angle)}
                  className={`px-3 py-1.5 rounded-pill border text-xs ${rotation === angle ? 'bg-accent text-white border-accent' : 'border-border text-text'}`}>
                  Rotate {angle}°
                </button>
              ))}
            </div>
            <select value={flip} onChange={e => setFlip(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-bg-alt text-text text-sm">
              <option value="none">No flip</option><option value="horizontal">Flip horizontally</option><option value="vertical">Flip vertically</option>
            </select>
            <select value={fitMode} onChange={e => setFitMode(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-bg-alt text-text text-sm">
              <option value="crop">Fill dimensions (crop edges)</option>
              <option value="contain">Fit inside dimensions (add margins)</option>
            </select>
            <label className="flex items-center gap-2 text-xs text-text cursor-pointer"><input type="checkbox" checked={grayscale} onChange={e => setGrayscale(e.target.checked)} className="accent-accent" /> Black &amp; white / grayscale</label>
            <label className="flex items-center gap-2 text-xs text-text cursor-pointer"><input type="checkbox" checked={whiteBackground} onChange={e => setWhiteBackground(e.target.checked)} className="accent-accent" /> White background for JPG</label>
          </div>
        </div>
      </div>

      <div onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); selectFiles(e.dataTransfer.files) }}
        className="p-8 border-2 border-dashed border-border hover:border-accent/60 bg-surface rounded-2xl text-center cursor-pointer transition-colors">
        <div className="text-4xl mb-2">🖼</div>
        <p className="text-sm font-semibold text-text">{files.length ? `${files.length} image(s) selected` : 'Choose or drop images'}</p>
        <p className="text-xs text-text-muted mt-1">JPG, PNG, WebP, GIF, TIFF and other browser-supported formats</p>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => selectFiles(e.target.files)} />
      </div>

      <button type="button" onClick={compress} disabled={!files.length || loading}
        className="w-full py-3.5 rounded-xl bg-accent text-white font-bold text-sm disabled:opacity-50">
        {loading ? 'Processing images…' : 'Prepare form-ready images'}
      </button>

      <div className="p-4 rounded-xl bg-accent-subtle border border-accent/20 text-xs text-text-secondary">
        <strong className="text-text">How sizing works:</strong> file size uses KB/MB. Dimensions can be entered in px, inches, cm, or mm.
        Physical units are converted to pixels using the selected DPI before export.
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between"><h2 className="text-sm font-bold text-text">Results</h2>
            <button type="button" onClick={() => results.forEach(download)} className="px-4 py-2 rounded-pill bg-accent text-white text-xs font-semibold">Download all</button>
          </div>
          {results.map(result => (
            <div key={result.name} className="flex items-center gap-4 flex-wrap p-4 rounded-xl bg-surface border border-border">
              <img src={result.dataUrl} alt={result.name} className="w-16 h-16 object-cover rounded-lg border border-border" />
              <div className="flex-1 min-w-[180px]">
                <div className="text-sm font-semibold text-text truncate">{result.name}</div>
                <div className="text-xs text-text-muted">{result.w}×{result.h}px · {formatBytes(result.bytes)} (from {formatBytes(result.originalBytes)})</div>
                <div className={`text-xs mt-1 ${result.meetsTarget ? 'text-success' : 'text-accent-text'}`}>
                  {result.meetsTarget ? 'Target size reached' : 'Smallest safe result; target may require lower dimensions'}
                </div>
              </div>
              <button type="button" onClick={() => download(result)} className="px-4 py-2 rounded-pill bg-accent text-white text-xs font-semibold">Download</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
