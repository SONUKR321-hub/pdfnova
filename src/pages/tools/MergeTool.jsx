import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import FileDropzone from '../../components/processor/FileDropzone'
import ProgressBar from '../../components/processor/ProgressBar'
import ResultCard from '../../components/processor/ResultCard'
import { mergePDFs } from '../../lib/pdf-merge'
import { downloadBytes, formatSize } from '../../lib/pdf-utils'
import { useAppStore } from '../../store/useAppStore'

export default function MergeTool() {
  const [files, setFiles] = useState([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [mergedBytes, setMergedBytes] = useState(null)
  const { addToast } = useAppStore()

  const handleFilesSelected = (newFiles) => {
    setFiles((prev) => [...prev, ...newFiles])
  }

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const moveFile = (from, to) => {
    if (to < 0 || to >= files.length) return
    const updated = [...files]
    const [moved] = updated.splice(from, 1)
    updated.splice(to, 0, moved)
    setFiles(updated)
  }

  const handleMerge = async () => {
    if (files.length < 2) {
      addToast('Please select at least 2 PDF files to merge.', 'error')
      return
    }

    try {
      setProcessing(true)
      setProgress(0)
      const bytes = await mergePDFs(files, (pct, msg) => {
        setProgress(pct)
        setStatusText(msg)
      })
      setMergedBytes(bytes)
      addToast('PDFs merged successfully!', 'success')
    } catch (err) {
      addToast(err.message || 'Error merging PDFs.', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!mergedBytes) return
    downloadBytes(mergedBytes, 'merged_document.pdf')
  }

  const handleReset = () => {
    setFiles([])
    setMergedBytes(null)
    setProgress(0)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text mb-4 transition-colors">
          <Icon name="ArrowRight" size={13} className="rotate-180" />
          <span>Back to All Tools</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#6F8F7A] text-white flex items-center justify-center">
            <Icon name="GitMerge" size={22} />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-text">Merge PDFs</h1>
            <p className="text-xs sm:text-sm text-text-muted">Combine multiple PDF documents into a single organized file.</p>
          </div>
        </div>
      </div>

      {mergedBytes ? (
        <ResultCard
          title="Documents Merged Successfully"
          filename="merged_document.pdf"
          fileSizeBytes={mergedBytes.byteLength}
          onDownload={handleDownload}
          onReset={handleReset}
        />
      ) : processing ? (
        <ProgressBar progress={progress} statusText={statusText} />
      ) : (
        <div className="space-y-6">
          <FileDropzone
            accept=".pdf"
            multiple={true}
            title="Drop PDF files to merge, or browse"
            subtitle="Select two or more PDF documents. Reorder them below before combining."
            onFilesSelected={handleFilesSelected}
          />

          {files.length > 0 && (
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-sm font-semibold text-text">
                  Selected Files ({files.length})
                </span>
                <button
                  onClick={() => setFiles([])}
                  className="text-xs text-danger hover:underline font-medium"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {files.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-bg-alt/60 border border-border text-sm"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="w-6 h-6 rounded-full bg-accent-subtle text-accent-text text-xs flex items-center justify-center font-semibold shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <p className="font-medium text-text truncate">{file.name}</p>
                        <p className="text-xs text-text-muted">{formatSize(file.size)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      <button
                        onClick={() => moveFile(idx, idx - 1)}
                        disabled={idx === 0}
                        aria-label="Move file up"
                        className="p-1 text-text-muted hover:text-text disabled:opacity-30"
                      >
                        <Icon name="ChevronUp" size={16} />
                      </button>
                      <button
                        onClick={() => moveFile(idx, idx + 1)}
                        disabled={idx === files.length - 1}
                        aria-label="Move file down"
                        className="p-1 text-text-muted hover:text-text disabled:opacity-30"
                      >
                        <Icon name="ChevronDown" size={16} />
                      </button>
                      <button
                        onClick={() => removeFile(idx)}
                        aria-label="Remove file"
                        className="p-1 text-text-muted hover:text-danger ml-1"
                      >
                        <Icon name="Trash2" size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleMerge}
                  disabled={files.length < 2}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-pill bg-accent hover:bg-accent-text disabled:opacity-50 text-white font-medium text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Icon name="GitMerge" size={16} />
                  <span>Merge {files.length} Files</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
