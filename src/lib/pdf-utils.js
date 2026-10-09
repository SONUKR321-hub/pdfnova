/**
 * PDF Utilities — shared helpers
 */

/** Read a File or Blob as ArrayBuffer */
export async function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

/** Format bytes to human-readable string */
export function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '—'
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(2) + ' GB'
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB'
  if (bytes >= 1e3) return (bytes / 1e3).toFixed(0) + ' KB'
  return bytes + ' B'
}

/** Calculate size reduction percentage */
export function calcReduction(original, processed) {
  if (!original || !processed || original <= 0) return 0
  return Math.max(0, Math.round((1 - processed / original) * 100))
}

/** Trigger a browser download from a Uint8Array */
export function downloadBytes(bytes, filename, mimeType = 'application/pdf') {
  const blob = new Blob([bytes], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

/** Validate file before processing */
export function validateFile(file, { maxMB = 50, allowedExts = [] } = {}) {
  if (!file) return 'No file selected.'
  if (file.size > maxMB * 1024 * 1024) return `File too large. Maximum size is ${maxMB} MB.`
  if (allowedExts.length > 0) {
    const ext = file.name.split('.').pop().toLowerCase()
    if (!allowedExts.includes(ext)) {
      return `Unsupported format. Please use: ${allowedExts.join(', ')}.`
    }
  }
  return null
}
