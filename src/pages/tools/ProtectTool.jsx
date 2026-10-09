import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import FileDropzone from '../../components/processor/FileDropzone'
import ProgressBar from '../../components/processor/ProgressBar'
import ResultCard from '../../components/processor/ResultCard'
import { protectPDF, unlockPDF } from '../../lib/pdf-protect'
import { downloadBytes } from '../../lib/pdf-utils'
import { useAppStore } from '../../store/useAppStore'

export default function ProtectTool() {
  const [file, setFile] = useState(null)
  const [mode, setMode] = useState('protect') // 'protect' | 'unlock'
  const [password, setPassword] = useState('')
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [resultBytes, setResultBytes] = useState(null)
  const { addToast } = useAppStore()

  const handleAction = async () => {
    if (!file || !password) {
      addToast('Please provide both the PDF file and password.', 'error')
      return
    }

    try {
      setProcessing(true)
      setProgress(0)

      let bytes
      if (mode === 'protect') {
        bytes = await protectPDF(file, password, password, (pct, msg) => {
          setProgress(pct)
          setStatusText(msg)
        })
        addToast('Document protected successfully!', 'success')
      } else {
        bytes = await unlockPDF(file, password, (pct, msg) => {
          setProgress(pct)
          setStatusText(msg)
        })
        addToast('Document unlocked successfully!', 'success')
      }

      setResultBytes(bytes)
    } catch (err) {
      addToast(err.message || 'Action failed.', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!resultBytes || !file) return
    const prefix = mode === 'protect' ? 'protected_' : 'unlocked_'
    downloadBytes(resultBytes, `${prefix}${file.name}`)
  }

  const handleReset = () => {
    setFile(null)
    setPassword('')
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
          <div className="w-10 h-10 rounded-lg bg-[#B65C52] text-white flex items-center justify-center">
            <Icon name="Lock" size={22} />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-text">Password Protect & Unlock</h1>
            <p className="text-xs sm:text-sm text-text-muted">Encrypt files with a password or remove encryption from authorized PDFs.</p>
          </div>
        </div>
      </div>

      {resultBytes ? (
        <ResultCard
          title={mode === 'protect' ? 'PDF Protected' : 'PDF Unlocked'}
          filename={`${mode === 'protect' ? 'protected_' : 'unlocked_'}${file?.name}`}
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
          title="Drop PDF file here, or browse"
          subtitle="Add password encryption or remove existing passwords locally."
          onFilesSelected={(selectedFile) => setFile(selectedFile)}
        />
      ) : (
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <p className="text-sm font-semibold text-text">{file.name}</p>
              <p className="text-xs text-text-muted">Configure security action</p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-xs text-text-muted hover:text-text border border-border px-3 py-1 rounded-pill"
            >
              Change file
            </button>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setMode('protect')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium border flex items-center justify-center gap-2 transition-all ${
                mode === 'protect'
                  ? 'border-accent bg-accent-subtle text-accent-text'
                  : 'border-border text-text-muted hover:text-text'
              }`}
            >
              <Icon name="Lock" size={16} />
              <span>Add Password</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('unlock')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium border flex items-center justify-center gap-2 transition-all ${
                mode === 'unlock'
                  ? 'border-accent bg-accent-subtle text-accent-text'
                  : 'border-border text-text-muted hover:text-text'
              }`}
            >
              <Icon name="Unlock" size={16} />
              <span>Remove Password</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">
              {mode === 'protect' ? 'Choose Password' : 'Enter Current Password'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 bg-bg-alt border border-border focus:border-border-focus rounded-md text-sm outline-none"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <button
              onClick={handleAction}
              disabled={!password}
              className="px-6 py-2.5 rounded-pill bg-accent hover:bg-accent-text disabled:opacity-50 text-white font-medium text-sm shadow-sm transition-all flex items-center gap-2"
            >
              <Icon name={mode === 'protect' ? 'Lock' : 'Unlock'} size={16} />
              <span>{mode === 'protect' ? 'Apply Protection' : 'Unlock Document'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
