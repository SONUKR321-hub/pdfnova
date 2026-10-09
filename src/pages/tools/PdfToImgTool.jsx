import React, { useState, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

export default function PdfToImgTool() {
  const { addToast } = useAppStore()
  const [file, setFile] = useState(null)
  const [pages, setPages] = useState([]) // [{dataUrl, page}]
  const [loading, setLoading] = useState(false)
  const [scale, setScale] = useState(2)
  const [format, setFormat] = useState('png')
  const fileRef = useRef(null)

  const handleFile = async (f) => {
    if (!f) return
    setFile(f)
    setPages([])
    setLoading(true)
    try {
      const buf = await f.arrayBuffer()
      const doc = await pdfjsLib.getDocument({ data: buf }).promise
      const imgs = []
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i)
        const vp = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        canvas.width = vp.width; canvas.height = vp.height
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise
        imgs.push({ dataUrl: canvas.toDataURL(format === 'jpg' ? 'image/jpeg' : 'image/png', 0.92), page: i })
      }
      setPages(imgs)
      addToast(`Converted ${doc.numPages} page(s) to ${format.toUpperCase()}`, 'ok')
    } catch (e) {
      addToast('Conversion failed: ' + e.message, 'err')
    }
    setLoading(false)
  }

  const download = (item) => {
    const a = document.createElement('a')
    a.href = item.dataUrl
    a.download = `page_${item.page}.${format}`
    a.click()
  }

  const downloadAll = () => {
    pages.forEach(p => download(p))
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>PDF → Images</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>Export each PDF page as a high-quality image.</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Format:
          <select value={format} onChange={e => setFormat(e.target.value)} style={{ marginLeft: 8, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--text)', fontSize: 13 }}>
            <option value="png">PNG</option>
            <option value="jpg">JPEG</option>
          </select>
        </label>
        <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Resolution:
          <select value={scale} onChange={e => setScale(+e.target.value)} style={{ marginLeft: 8, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--text)', fontSize: 13 }}>
            <option value={1}>72 dpi</option>
            <option value={2}>144 dpi (default)</option>
            <option value={3}>216 dpi (high)</option>
            <option value={4}>288 dpi (max)</option>
          </select>
        </label>
      </div>

      {!file && (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f?.type === 'application/pdf') handleFile(f) }}
          style={{ border: '2px dashed var(--border)', borderRadius: 16, padding: '48px 32px', textAlign: 'center', cursor: 'pointer', background: 'var(--surface)' }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>🖼</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Choose or drop a PDF</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Converts each page to {format.toUpperCase()}</p>
        </div>
      )}
      <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0])} />

      {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>⏳ Converting pages…</div>}

      {pages.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{pages.length} page(s) converted</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setFile(null); setPages([]) }} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-alt)', fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>← New File</button>
              <button onClick={downloadAll} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>⬇ Download All</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
            {pages.map(p => (
              <div key={p.page} style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'var(--surface)' }}>
                <img src={p.dataUrl} alt={`page ${p.page}`} style={{ width: '100%', display: 'block' }} />
                <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Page {p.page}</span>
                  <button onClick={() => download(p)} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}>⬇</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
