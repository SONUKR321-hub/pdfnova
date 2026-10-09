import React, { useRef, useState } from 'react'
import Icon from '../ui/Icon'
import { formatSize, validateFile } from '../../lib/pdf-utils'

export default function FileDropzone({
  onFilesSelected,
  accept = '.pdf',
  multiple = false,
  title = 'Drop your file here, or browse',
  subtitle = 'Supports PDF up to 50MB. Processed entirely offline.',
  className = '',
}) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const processFileList = (fileList) => {
    setError(null)
    const valid = []
    const acceptedExts = accept
      .split(',')
      .map(ext => ext.trim().replace('.', '').toLowerCase())

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      const err = validateFile(file, { maxMB: 50, allowedExts: acceptedExts })
      if (err) {
        setError(err)
        return
      }
      valid.push(file)
      if (!multiple) break
    }

    if (valid.length > 0) {
      onFilesSelected(multiple ? valid : valid[0])
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      processFileList(e.dataTransfer.files)
    }
  }

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFileList(e.target.files)
    }
  }

  return (
    <div className={`w-full ${className}`}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 text-center ${
          isDragOver
            ? 'border-accent bg-accent-subtle shadow-md scale-[1.01]'
            : 'border-border hover:border-accent/60 bg-surface/80 hover:bg-surface'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="w-14 h-14 rounded-full bg-accent-subtle flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
          <Icon name="Upload" size={26} />
        </div>

        <h3 className="text-base sm:text-lg font-medium text-text group-hover:text-accent transition-colors">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-text-muted mt-1.5 max-w-sm">
          {subtitle}
        </p>

        <div className="mt-4 flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-pill bg-bg-alt border border-border text-xs text-text-secondary">
            <Icon name="Shield" size={13} className="mr-1.5 text-accent" />
            100% Client-Side
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-pill bg-bg-alt border border-border text-xs text-text-secondary">
            Max 50MB
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 rounded-md bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2 animate-fade-in">
          <Icon name="Info" size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
