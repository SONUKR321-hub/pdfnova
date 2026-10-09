/**
 * PDF Merge — combine multiple PDF files into one using pdf-lib
 */
import { PDFDocument } from 'pdf-lib'
import { readFileAsArrayBuffer } from './pdf-utils'

/**
 * @param {File[]} files  - Array of PDF File objects
 * @param {Function} onProgress - (percent, message) => void
 * @returns {Promise<Uint8Array>} merged PDF bytes
 */
export async function mergePDFs(files, onProgress) {
  if (!files || files.length < 2) throw new Error('Please select at least 2 PDF files.')

  const merged = await PDFDocument.create()
  const total = files.length

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const pct = Math.round(10 + (i / total) * 80)
    onProgress?.(pct, `Adding "${file.name}" (${i + 1}/${total})…`)

    try {
      const buffer = await readFileAsArrayBuffer(file)
      const doc = await PDFDocument.load(buffer)
      const pages = await merged.copyPages(doc, doc.getPageIndices())
      pages.forEach(p => merged.addPage(p))
    } catch (e) {
      throw new Error(`Could not read "${file.name}". Make sure it is a valid, unencrypted PDF.`)
    }
  }

  onProgress?.(95, 'Finalising…')
  const bytes = await merged.save({ useObjectStreams: true })
  onProgress?.(100, 'Done')
  return bytes
}
