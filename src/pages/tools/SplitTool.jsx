import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import FileDropzone from '../../components/processor/FileDropzone'
import ProgressBar from '../../components/processor/ProgressBar'
import ResultCard from '../../components/processor/ResultCard'
import { splitPDF, splitPDFIntoPages } from '../../lib/pdf-split'
import { downloadBytes } from '../../lib/pdf-utils'
import { useAppStore } from '../../store/useAppStore'

export default function SplitTool() {
  const [file, setFile] = useState(null)
  const [pageRange, setPageRange] = useState('')
  const [splitAll, setSplitAll] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [resultBytes, setResultBytes] = useState(null)
  const { addToast } = useAppStore()

  const handleSplit = async () => {
    if (!file) return

    try {
      setProcessing(true)
      setProgress(0)

      if (splitAll) {
        const pages = await splitPDFIntoPages(file, (pct, msg) => {
          setProgress(pct)
          setStatusText(msg)
        })
        pages.forEach((p) => downloadBytes(p.bytes, p.name))
        addToast(`Extracted ${pages.length} individual pages!`, 'success')
        handleReset()
        return
      }

      // Parse custom page range (e.g. 1-3, 5)
      const pagesToExtract = []
      const parts = pageRange.split(',').map((p) => p.trim())
      for (const part of parts) {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map((n) => parseInt(n, 10))
          if (isNaN(start) || isNaN(end) || start > end) {
            throw new Error(`Invalid range format: "${part}"`)
          }
          for (let i = start; i <= end; i++) pagesToExtract.push(i)
        } else {
          const num = parseInt(part, 10)
          if (isNaN(num)) throw new Error(`Invalid page number: "${part}"`)
          pagesToExtract.push(num)
        }
      }

      if (pagesToExtract.length === 0) {
        throw new Error('Please enter at least one valid page number or range.')
      }

      const bytes = await splitPDF(file, pagesToExtract, (pct, msg) => {
        setProgress(pct)
        setStatusText(msg)
      })

      setResultBytes(bytes)
      addToast('Pages extracted successfully!', 'success')
    } catch (err) {
      addToast(err.message || 'Error splitting PDF.', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!resultBytes || !file) return
    downloadBytes(resultBytes, `extracted_${file.name}`)
  }

  const handleReset = () => {
    setFile(null)
    setPageRange('')
    setSplitAll(false)
    setResultBytes(null)
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
            <Icon name="Scissors" size={22} />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-text">Split PDF</h1>
            <p className="text-xs sm:text-sm text-text-muted">Extract specific pages or break a PDF into standalone pages.</p>
          </div>
        </div>
      </div>

      {resultBytes ? (
        <ResultCard
          title="Pages Extracted Successfully"
          filename={`extracted_${file?.name}`}
          fileSizeBytes={resultBytes.byteLength}
          onDownload={handleDownload}
          onReset={handleReset}
        />
      ) : processing ? (
        <ProgressBar progress={progress} statusText={statusText} />
      ) : !file ? (
        <FileDropzone
          accept=".pdf"
          multiple={false}
          title="Drop PDF file to split, or browse"
          subtitle="Choose any PDF to extract pages or divide into segments."
          onFilesSelected={(selectedFile) => setFile(selectedFile)}
        />
      ) : (
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <p className="text-sm font-semibold text-text">{file.name}</p>
              <p className="text-xs text-text-muted">Ready to configure split settings</p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-xs text-text-muted hover:text-text border border-border px-3 py-1 rounded-pill"
            >
              Change file
            </button>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-bg-alt/50 cursor-pointer">
              <input
                type="radio"
                checked={!splitAll}
                onChange={() => setSplitAll(false)}
                className="text-accent"
              />
              <div className="text-sm">
                <span className="font-medium text-text">Custom Page Range</span>
                <p className="text-xs text-text-muted">Extract specific pages (e.g. "1-4, 7, 9-12")</p>
              </div>
            </label>

            {!splitAll && (
              <div className="pl-6">
                <input
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="e.g. 1-3, 5"
                  className="w-full sm:w-80 px-3 py-2 bg-bg-alt border border-border focus:border-border-focus rounded-md text-sm outline-none"
                />
              </div>
            )}

            <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-bg-alt/50 cursor-pointer">
              <input
                type="radio"
                checked={splitAll}
                onChange={() => setSplitAll(true)}
                className="text-accent"
              />
              <div className="text-sm">
                <span className="font-medium text-text">Split all pages</span>
                <p className="text-xs text-text-muted">Downloads every single page as an individual PDF file.</p>
              </div>
            </label>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <button
              onClick={handleSplit}
              className="px-6 py-2.5 rounded-pill bg-accent hover:bg-accent-text text-white font-medium text-sm shadow-sm transition-all flex items-center gap-2"
            >
              <Icon name="Scissors" size={16} />
              <span>{splitAll ? 'Extract All Pages' : 'Extract Selected Pages'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
