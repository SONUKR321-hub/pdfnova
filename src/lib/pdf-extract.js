/**
 * PDF Text Extraction using pdfjs-dist
 */
import { readFileAsArrayBuffer } from './pdf-utils'

export async function extractText(file, onProgress) {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')
  GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href

  onProgress?.(5, 'Loading PDF…')
  const buffer = await readFileAsArrayBuffer(file)
  const pdfDoc = await getDocument({ data: buffer }).promise
  const total = pdfDoc.numPages
  const pageTexts = []

  for (let i = 1; i <= total; i++) {
    onProgress?.(Math.round(10 + (i / total) * 85), `Extracting page ${i} of ${total}…`)
    const page = await pdfDoc.getPage(i)
    const content = await page.getTextContent()
    const text = content.items.map(item => item.str).join(' ')
    pageTexts.push({ page: i, text })
  }

  onProgress?.(100, 'Done')
  return pageTexts
}

/**
 * Get PDF metadata (page count, dimensions, title, etc.)
 */
export async function getPDFInfo(file) {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')
  GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href

  const buffer = await readFileAsArrayBuffer(file)
  const pdfDoc = await getDocument({ data: buffer }).promise
  const meta = await pdfDoc.getMetadata()
  const page1 = await pdfDoc.getPage(1)
  const vp = page1.getViewport({ scale: 1 })

  return {
    numPages: pdfDoc.numPages,
    title: meta.info?.Title || '',
    author: meta.info?.Author || '',
    width: Math.round(vp.width),
    height: Math.round(vp.height),
    isEncrypted: pdfDoc.isEncrypted,
  }
}
