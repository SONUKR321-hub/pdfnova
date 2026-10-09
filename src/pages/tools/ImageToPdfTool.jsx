import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import FileDropzone from '../../components/processor/FileDropzone'
import ProgressBar from '../../components/processor/ProgressBar'
import ResultCard from '../../components/processor/ResultCard'
import { imagesToPDF } from '../../lib/image-to-pdf'
import { downloadBytes, formatSize } from '../../lib/pdf-utils'
import { useAppStore } from '../../store/useAppStore'

export default function ImageToPdfTool() {
  const [files, setFiles] = useState([])
  const [pageSize, setPageSize] = useState('fit')
  const [margin, setMargin] = useState(20)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [resultBytes, setResultBytes] = useState(null)
  const { addToast } = useAppStore()

  const handleFilesSelected = (newFiles) => {
    setFiles((prev) => [...prev, ...newFiles])
  }

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleConvert = async () => {
    if (files.length === 0) return

    try {
      setProcessing(true)
      setProgress(0)
      const bytes = await imagesToPDF(
        files,
        { pageFit: pageSize, margin: Number(margin) },
        (pct, msg) => {
          setProgress(pct)
          setStatusText(msg)
        }
      )
      setResultBytes(bytes)
      addToast('Images converted to PDF successfully!', 'success')
    } catch (err) {
      addToast(err.message || 'Error converting images.', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!resultBytes) return
    downloadBytes(resultBytes, 'converted_images.pdf')
  }

  const handleReset = () => {
    setFiles([])
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
          <div className="w-10 h-10 rounded-lg bg-[#4F7FBA] text-white flex items-center justify-center">
            <Icon name="Image" size={22} />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-text">Image → PDF</h1>
            <p className="text-xs sm:text-sm text-text-muted">Turn JPG, PNG, WebP or GIF photos into a formatted PDF file.</p>
          </div>
        </div>
      </div>

      {resultBytes ? (
        <ResultCard
          title="PDF Created Successfully"
          filename="converted_images.pdf"
          fileSizeBytes={resultBytes.byteLength}
          onDownload={handleDownload}
          onReset={handleReset}
        />
      ) : processing ? (
        <ProgressBar progress={progress} statusText={statusText} />
      ) : (
        <div className="space-y-6">
          <FileDropzone
            accept=".jpg,.jpeg,.png,.webp,.gif"
            multiple={true}
            title="Drop images here, or browse"
            subtitle="Combine multiple pictures into one clean document."
            onFilesSelected={handleFilesSelected}
          />

          {files.length > 0 && (
            <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-sm font-semibold text-text">
                  Selected Images ({files.length})
                </span>
                <button
                  onClick={() => setFiles([])}
                  className="text-xs text-danger hover:underline font-medium"
                >
                  Clear all
                </button>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-border">
                <div>
                  <label className="block text-xs font-semibold text-text mb-1.5">Page Size</label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-alt border border-border rounded-md text-sm outline-none"
                  >
                    <option value="fit">Fit to Image Size</option>
                    <option value="A4">Standard A4 Portrait</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text mb-1.5">Margin (px)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={margin}
                    onChange={(e) => setMargin(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-alt border border-border rounded-md text-sm outline-none"
                  />
                </div>
              </div>

              {/* Thumbnails preview list */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto">
                {files.map((file, idx) => (
                  <div key={idx} className="relative group border border-border rounded-lg p-2 bg-bg-alt text-center">
                    <p className="text-xs font-medium text-text truncate mb-1">{file.name}</p>
                    <p className="text-[10px] text-text-muted">{formatSize(file.size)}</p>
                    <button
                      onClick={() => removeFile(idx)}
                      className="absolute top-1 right-1 p-1 bg-surface rounded-full shadow text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Icon name="X" size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleConvert}
                  className="px-6 py-2.5 rounded-pill bg-accent hover:bg-accent-text text-white font-medium text-sm shadow-sm transition-all flex items-center gap-2"
                >
                  <Icon name="FileText" size={16} />
                  <span>Generate PDF</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
