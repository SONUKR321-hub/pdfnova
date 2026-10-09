/**
 * PDF Split — extract a subset of pages from a PDF using pdf-lib
 */
import { PDFDocument } from 'pdf-lib'
import { readFileAsArrayBuffer } from './pdf-utils'

/**
 * @param {File}     file       - Source PDF file
 * @param {number[]} pageNums   - 1-based page numbers to extract
 * @param {Function} onProgress
 * @returns {Promise<Uint8Array>}
 */
export async function splitPDF(file, pageNums, onProgress) {
  onProgress?.(10, 'Loading document…')
  const buffer = await readFileAsArrayBuffer(file)

  onProgress?.(30, 'Parsing pages…')
  const srcDoc = await PDFDocument.load(buffer)
  const totalPages = srcDoc.getPageCount()

  // Validate
  const invalid = pageNums.filter(n => n < 1 || n > totalPages)
  if (invalid.length > 0) throw new Error(`Invalid page numbers: ${invalid.join(', ')}`)

  onProgress?.(50, 'Extracting pages…')
  const newDoc = await PDFDocument.create()
  // Convert 1-based to 0-based
  const indices = pageNums.map(n => n - 1)
  const pages = await newDoc.copyPages(srcDoc, indices)
  pages.forEach(p => newDoc.addPage(p))

  onProgress?.(85, 'Saving…')
  const bytes = await newDoc.save({ useObjectStreams: true })
  onProgress?.(100, 'Done')
  return bytes
}

/**
 * Split PDF into individual single-page PDFs
 * @returns {Promise<{bytes: Uint8Array, name: string}[]>}
 */
export async function splitPDFIntoPages(file, onProgress) {
  onProgress?.(10, 'Loading document…')
  const buffer = await readFileAsArrayBuffer(file)
  const srcDoc = await PDFDocument.load(buffer)
  const total = srcDoc.getPageCount()
  const results = []

  for (let i = 0; i < total; i++) {
    onProgress?.(10 + Math.round((i / total) * 85), `Extracting page ${i + 1} of ${total}…`)
    const pageDoc = await PDFDocument.create()
    const [page] = await pageDoc.copyPages(srcDoc, [i])
    pageDoc.addPage(page)
    const bytes = await pageDoc.save()
    results.push({ bytes, name: `${file.name.replace('.pdf', '')}_page${i + 1}.pdf` })
  }

  onProgress?.(100, 'Done')
  return results
}
