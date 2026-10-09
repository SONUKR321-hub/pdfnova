/**
 * Image → PDF conversion using pdf-lib
 * Supports: JPG, PNG, GIF (first frame), WebP (via canvas conversion)
 */
import { PDFDocument, rgb } from 'pdf-lib'
import { readFileAsArrayBuffer } from './pdf-utils'

/**
 * Convert canvas-rendered image to PNG ArrayBuffer for embedding
 */
async function imageFileToArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url)
        blob.arrayBuffer().then(resolve).catch(reject)
      }, 'image/png')
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not load image')) }
    img.src = url
  })
}

/**
 * @param {File[]} imageFiles - Array of image files
 * @param {Object} opts - { pageSize: 'A4'|'fit', margin: number }
 * @param {Function} onProgress
 */
export async function imagesToPDF(imageFiles, opts = {}, onProgress) {
  const { margin = 20, pageFit = 'fit' } = opts

  onProgress?.(5, 'Creating document…')
  const pdfDoc = await PDFDocument.create()
  const A4 = { width: 595.28, height: 841.89 }

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i]
    const pct = Math.round(10 + (i / imageFiles.length) * 85)
    onProgress?.(pct, `Embedding image ${i + 1} of ${imageFiles.length}…`)

    let image
    try {
      const ext = file.name.split('.').pop().toLowerCase()
      if (ext === 'jpg' || ext === 'jpeg') {
        const buf = await readFileAsArrayBuffer(file)
        image = await pdfDoc.embedJpg(buf)
      } else {
        // PNG + all others — canvas-convert to PNG
        const buf = await imageFileToArrayBuffer(file)
        image = await pdfDoc.embedPng(buf)
      }
    } catch {
      const buf = await imageFileToArrayBuffer(file)
      image = await pdfDoc.embedPng(buf)
    }

    const { width: imgW, height: imgH } = image

    let pageW, pageH
    if (pageFit === 'A4') {
      pageW = A4.width; pageH = A4.height
    } else {
      pageW = imgW; pageH = imgH
    }

    const page = pdfDoc.addPage([pageW, pageH])

    // Scale image to fit within margins
    const maxW = pageW - margin * 2
    const maxH = pageH - margin * 2
    const scale = Math.min(maxW / imgW, maxH / imgH, 1)
    const drawW = imgW * scale
    const drawH = imgH * scale
    const x = (pageW - drawW) / 2
    const y = (pageH - drawH) / 2

    page.drawImage(image, { x, y, width: drawW, height: drawH })
  }

  onProgress?.(98, 'Saving…')
  const bytes = await pdfDoc.save({ useObjectStreams: true })
  onProgress?.(100, 'Done')
  return bytes
}

/**
 * PDF → Images using pdfjs-dist
 * @param {File}   file
 * @param {number} scale - render scale (1 = 96dpi, 2 = 192dpi)
 * @param {Function} onProgress
 * @returns {Promise<{dataUrl: string, pageNum: number}[]>}
 */
export async function pdfToImages(file, scale = 2, onProgress) {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')
  GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href

  onProgress?.(5, 'Loading PDF…')
  const arrayBuffer = await readFileAsArrayBuffer(file)
  const pdfDoc = await getDocument({ data: arrayBuffer }).promise
  const total = pdfDoc.numPages
  const results = []

  for (let i = 1; i <= total; i++) {
    onProgress?.(Math.round(10 + (i / total) * 85), `Rendering page ${i} of ${total}…`)
    const page = await pdfDoc.getPage(i)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport }).promise
    results.push({ dataUrl: canvas.toDataURL('image/png'), pageNum: i })
  }

  onProgress?.(100, 'Done')
  return results
}
