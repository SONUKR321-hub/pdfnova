/**
 * PDF Signing — capture signature from canvas and embed into PDF
 * Uses signature_pad for input and pdf-lib for embedding
 */
import { PDFDocument, rgb } from 'pdf-lib'
import { readFileAsArrayBuffer } from './pdf-utils'

/**
 * Embed a signature image (PNG dataURL) into the last page of a PDF
 * @param {File}   file
 * @param {string} signatureDataUrl - PNG data URL from signature_pad
 * @param {{ x, y, width, height, pageIndex }} placement
 * @param {Function} onProgress
 */
export async function signPDF(file, signatureDataUrl, placement = {}, onProgress) {
  onProgress?.(10, 'Loading document…')
  const buffer = await readFileAsArrayBuffer(file)
  const pdfDoc = await PDFDocument.load(buffer)
  const pages = pdfDoc.getPages()

  const pageIndex = placement.pageIndex ?? pages.length - 1
  const page = pages[Math.min(pageIndex, pages.length - 1)]
  const { width: pw, height: ph } = page.getSize()

  onProgress?.(40, 'Embedding signature…')

  // Convert dataUrl to Uint8Array
  const base64 = signatureDataUrl.replace(/^data:image\/png;base64,/, '')
  const pngBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  const pngImage = await pdfDoc.embedPng(pngBytes)

  const sigW = placement.width || Math.min(200, pw * 0.3)
  const sigH = placement.height || sigW * 0.4
  const sigX = placement.x ?? pw - sigW - 40
  const sigY = placement.y ?? 60

  page.drawImage(pngImage, {
    x: sigX,
    y: sigY,
    width: sigW,
    height: sigH,
    opacity: 1,
  })

  // Draw a line under the signature
  page.drawLine({
    start: { x: sigX, y: sigY - 4 },
    end:   { x: sigX + sigW, y: sigY - 4 },
    thickness: 0.5,
    color: rgb(0.43, 0.42, 0.39),
  })

  onProgress?.(85, 'Saving…')
  const bytes = await pdfDoc.save({ useObjectStreams: true })
  onProgress?.(100, 'Done')
  return bytes
}
