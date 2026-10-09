/**
 * pdf-compress.js
 * Advanced Client-Side PDF Compression with Custom KB/MB Target Size
 * Supports:
 * - Exact Target Size in KB/MB (e.g., under 200 KB, 500 KB, 1 MB)
 * - Quality presets: Extreme, Recommended, Low, or Custom
 * - Canvas DPI scaling & JPEG quality optimization
 * - Grayscale mode for extreme document reduction
 * - Full metadata & unused stream removal
 */
import { PDFDocument } from 'pdf-lib'

/**
 * Compress PDF with extensive customization
 * @param {File|Blob} file - Original PDF file
 * @param {Object} options - Compression options
 * @param {Function} onProgress - Progress callback (pct, message)
 */
export async function compressPDF(file, options = {}, onProgress) {
  const {
    mode = 'recommended',       // 'extreme' | 'recommended' | 'low' | 'target' | 'custom'
    targetSizeKB = null,        // e.g. 200 (for 200 KB)
    quality = 0.65,             // 0.1 to 0.95
    dpiScale = 1.3,             // 0.8 to 2.0
    grayscale = false,          // convert images to black/white grayscale
    stripMetadata = true,
  } = options

  onProgress?.(5, 'Loading document…')
  const arrayBuffer = await file.arrayBuffer()
  const originalSize = file.size

  // Import pdfjs-dist for deep image/page re-rendering
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}pdf.worker.min.mjs`

  onProgress?.(15, 'Analyzing PDF pages & images…')
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdfDoc = await loadingTask.promise
  const numPages = pdfDoc.numPages

  // 1. Determine optimal quality and DPI scale based on mode
  let effectiveQuality = quality
  let effectiveScale = dpiScale

  if (mode === 'extreme') {
    effectiveQuality = 0.25
    effectiveScale = 0.9
  } else if (mode === 'recommended') {
    effectiveQuality = 0.55
    effectiveScale = 1.2
  } else if (mode === 'low') {
    effectiveQuality = 0.8
    effectiveScale = 1.6
  } else if (mode === 'target' && targetSizeKB) {
    // Dynamic calibration for target size
    const targetBytes = targetSizeKB * 1024
    const ratio = targetBytes / originalSize

    if (ratio < 0.15) {
      effectiveQuality = 0.18
      effectiveScale = 0.85
    } else if (ratio < 0.35) {
      effectiveQuality = 0.35
      effectiveScale = 1.0
    } else if (ratio < 0.6) {
      effectiveQuality = 0.55
      effectiveScale = 1.25
    } else {
      effectiveQuality = 0.75
      effectiveScale = 1.5
    }
  }

  const renderPdf = async (qualityForAttempt, scaleForAttempt, attempt, totalAttempts) => {
    const newPdfDoc = await PDFDocument.create()

    for (let i = 1; i <= numPages; i++) {
      const pageProgress = Math.round(
        20 + ((attempt + i / numPages) / totalAttempts) * 70
      )
      onProgress?.(
        pageProgress,
        totalAttempts > 1
          ? `Compressing page ${i} of ${numPages} (attempt ${attempt + 1} of ${totalAttempts})…`
          : `Compressing page ${i} of ${numPages}…`
      )

      const page = await pdfDoc.getPage(i)
      const baseVp = page.getViewport({ scale: 1.0 })
      const vp = page.getViewport({ scale: scaleForAttempt })

      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.floor(vp.width))
      canvas.height = Math.max(1, Math.floor(vp.height))

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Unable to create a canvas for PDF compression.')
      }
      if (grayscale) {
        ctx.filter = 'grayscale(100%)'
      }

      await page.render({ canvasContext: ctx, viewport: vp }).promise

      const dataUrl = canvas.toDataURL('image/jpeg', qualityForAttempt)
      const rawBase64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '')
      const imgBytes = Uint8Array.from(atob(rawBase64), c => c.charCodeAt(0))
      const embeddedImg = await newPdfDoc.embedJpg(imgBytes)

      const newPage = newPdfDoc.addPage([baseVp.width, baseVp.height])
      newPage.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: baseVp.width,
        height: baseVp.height,
      })
    }

    if (stripMetadata) {
      newPdfDoc.setTitle('')
      newPdfDoc.setAuthor('')
      newPdfDoc.setSubject('')
      newPdfDoc.setKeywords([])
      newPdfDoc.setProducer('PDFNova')
      newPdfDoc.setCreator('PDFNova')
    }

    return newPdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50,
    })
  }

  // Target mode is a maximum-size request. Re-render with progressively lower
  // quality and resolution until the limit is reached or the safe floor wins.
  const targetBytes = mode === 'target' && targetSizeKB > 0
    ? targetSizeKB * 1024
    : null
  const totalAttempts = targetBytes ? 6 : 1
  let finalBytes
  let attemptQuality = effectiveQuality
  let attemptScale = effectiveScale

  for (let attempt = 0; attempt < totalAttempts; attempt++) {
    finalBytes = await renderPdf(attemptQuality, attemptScale, attempt, totalAttempts)
    if (!targetBytes || finalBytes.byteLength <= targetBytes) break

    const sizeRatio = targetBytes / finalBytes.byteLength
    attemptQuality = Math.max(0.12, attemptQuality * Math.max(0.55, Math.sqrt(sizeRatio)))
    attemptScale = Math.max(0.55, attemptScale * Math.max(0.72, Math.sqrt(sizeRatio)))
  }

  onProgress?.(100, 'Done!')
  return finalBytes
}
