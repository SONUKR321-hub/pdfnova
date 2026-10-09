import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import FileDropzone from '../../components/processor/FileDropzone'
import ProgressBar from '../../components/processor/ProgressBar'
import { extractText } from '../../lib/pdf-extract'
import { useAppStore } from '../../store/useAppStore'

export default function ExtractTextTool() {
  const [file, setFile] = useState(null)
  const [pagesText, setPagesText] = useState([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('')
  const { addToast } = useAppStore()

  const handleExtract = async (targetFile) => {
    if (!targetFile) return
    try {
      setFile(targetFile)
      setProcessing(true)
      setProgress(0)
      const results = await extractText(targetFile, (pct, msg) => {
        setProgress(pct)
        setStatusText(msg)
      })
      setPagesText(results)
      addToast('Text extracted successfully!', 'success')
    } catch (err) {
      addToast(err.message || 'Error extracting text from PDF.', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const handleCopyAll = () => {
    const fullText = pagesText.map(p => `--- Page ${p.page} ---\n${p.text}`).join('\n\n')
    navigator.clipboard.writeText(fullText)
    addToast('Copied all text to clipboard!', 'success')
  }

  const handleDownloadTxt = () => {
    const fullText = pagesText.map(p => `--- Page ${p.page} ---\n${p.text}`).join('\n\n')
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${file?.name.replace('.pdf', '') || 'document'}_extracted.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    setFile(null)
    setPagesText([])
    setProgress(0)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text mb-4 transition-colors">
          <Icon name="ArrowRight" size={13} className="rotate-180" />
          <span>Back to All Tools</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#9B7FA8] text-white flex items-center justify-center">
            <Icon name="AlignLeft" size={22} />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-text">Extract Text</h1>
            <p className="text-xs sm:text-sm text-text-muted">Extract raw textual content from any PDF document without upload.</p>
          </div>
        </div>
      </div>

      {pagesText.length > 0 ? (
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-4">
            <div>
              <p className="text-sm font-semibold text-text">{file?.name}</p>
              <p className="text-xs text-text-muted">{pagesText.length} pages extracted</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyAll}
                className="px-4 py-2 border border-border bg-surface hover:bg-bg-alt text-text text-xs font-medium rounded-pill flex items-center gap-1.5 transition-colors"
              >
                <Icon name="FileText" size={14} />
                <span>Copy All</span>
              </button>
              <button
                onClick={handleDownloadTxt}
                className="px-4 py-2 bg-accent hover:bg-accent-text text-white text-xs font-medium rounded-pill flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Icon name="Download" size={14} />
                <span>Save as .TXT</span>
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-2 text-text-muted hover:text-text text-xs font-medium transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {pagesText.map((p) => (
              <div key={p.page} className="p-4 rounded-lg bg-bg-alt/70 border border-border">
                <span className="text-xs font-semibold text-accent uppercase tracking-wider block mb-2">
                  Page {p.page}
                </span>
                <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap font-mono">
                  {p.text || '(No selectable text found on this page)'}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : processing ? (
        <ProgressBar progress={progress} statusText={statusText} />
      ) : (
        <FileDropzone
          accept=".pdf"
          multiple={false}
          title="Drop PDF to extract text, or browse"
          subtitle="Parse text directly on your device."
          onFilesSelected={(f) => handleExtract(f)}
        />
      )}
    </div>
  )
}
