import React, { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SignaturePad from 'signature_pad'
import Icon from '../../components/ui/Icon'
import FileDropzone from '../../components/processor/FileDropzone'
import ProgressBar from '../../components/processor/ProgressBar'
import ResultCard from '../../components/processor/ResultCard'
import { signPDF } from '../../lib/pdf-sign'
import { downloadBytes } from '../../lib/pdf-utils'
import { useAppStore } from '../../store/useAppStore'

export default function SignTool() {
  const [file, setFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [resultBytes, setResultBytes] = useState(null)
  const canvasRef = useRef(null)
  const sigPadRef = useRef(null)
  const { addToast } = useAppStore()

  useEffect(() => {
    if (file && canvasRef.current && !sigPadRef.current) {
      sigPadRef.current = new SignaturePad(canvasRef.current, {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        penColor: '#191816',
      })
    }
  }, [file])

  const clearSignature = () => {
    sigPadRef.current?.clear()
  }

  const handleSign = async () => {
    if (!file) return
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
      addToast('Please draw your signature first.', 'error')
      return
    }

    try {
      setProcessing(true)
      setProgress(0)
      const dataUrl = sigPadRef.current.toDataURL('image/png')
      const bytes = await signPDF(file, dataUrl, {}, (pct, msg) => {
        setProgress(pct)
        setStatusText(msg)
      })

      setResultBytes(bytes)
      addToast('Document signed successfully!', 'success')
    } catch (err) {
      addToast(err.message || 'Error signing document.', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!resultBytes || !file) return
    downloadBytes(resultBytes, `signed_${file.name}`)
  }

  const handleReset = () => {
    setFile(null)
    setResultBytes(null)
    setProgress(0)
    sigPadRef.current = null
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text mb-4 transition-colors">
          <Icon name="ArrowRight" size={13} className="rotate-180" />
          <span>Back to All Tools</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#4A8BA8] text-white flex items-center justify-center">
            <Icon name="PenTool" size={22} />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-text">Sign Document</h1>
            <p className="text-xs sm:text-sm text-text-muted">Draw your signature and embed it cleanly onto your PDF.</p>
          </div>
        </div>
      </div>

      {resultBytes ? (
        <ResultCard
          title="Document Signed Successfully"
          filename={`signed_${file?.name}`}
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
          title="Drop PDF to sign, or browse"
          subtitle="Add your legal signature to contracts, forms, and documents."
          onFilesSelected={(selectedFile) => setFile(selectedFile)}
        />
      ) : (
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <p className="text-sm font-semibold text-text">{file.name}</p>
              <p className="text-xs text-text-muted">Draw signature below to append</p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-xs text-text-muted hover:text-text border border-border px-3 py-1 rounded-pill"
            >
              Change file
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-text">Signature Canvas</label>
              <button
                type="button"
                onClick={clearSignature}
                className="text-xs text-accent hover:underline font-medium"
              >
                Clear
              </button>
            </div>
            <div className="border border-border rounded-lg bg-surface-elevated p-2">
              <canvas
                ref={canvasRef}
                width={500}
                height={160}
                className="signature-canvas w-full h-40 border border-dashed border-border rounded bg-white"
              />
            </div>
            <p className="text-[11px] text-text-muted mt-1.5">
              Use mouse, stylus, or fingertip on touchscreens to draw your signature.
            </p>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <button
              onClick={handleSign}
              className="px-6 py-2.5 rounded-pill bg-accent hover:bg-accent-text text-white font-medium text-sm shadow-sm transition-all flex items-center gap-2"
            >
              <Icon name="PenTool" size={16} />
              <span>Apply Signature & Download</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
