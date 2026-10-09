import React, { useState, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'

export default function ExtractImgTool() {
  const { addToast } = useAppStore()
  const [file, setFile] = useState(null)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const fileRef = useRef(null)

  const extract = async (f) => {
    setFile(f); setImages([]); setLoading(true)
    try {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
      const buf = await f.arrayBuffer()
      const doc = await pdfjsLib.getDocument({ data: buf }).promise
      const imgs = []
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i)
        const vp = page.getViewport({ scale: 2 })
        const canvas = document.createElement('canvas')
        canvas.width = vp.width; canvas.height = vp.height
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise
        imgs.push({ dataUrl: canvas.toDataURL('image/png'), page: i, w: vp.width, h: vp.height })
      }
      setImages(imgs)
      addToast(`Extracted ${imgs.length} page image(s)`, 'ok')
    } catch (e) { addToast('Failed: ' + e.message, 'err') }
    setLoading(false)
  }

  const download = (img) => {
    const a = document.createElement('a')
    a.href = img.dataUrl; a.download = `page_${img.page}.png`; a.click()
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Extract Images</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>Pull all embedded images from a PDF instantly.</p>

      {!file && (
        <div onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f?.type === 'application/pdf') extract(f) }}
          style={{ border: '2px dashed var(--border)', borderRadius: 16, padding: '56px 32px', textAlign: 'center', cursor: 'pointer', background: 'var(--surface)' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>📷</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Choose or drop a PDF</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Extracts page images as high-res PNG</p>
        </div>
      )}
      <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => extract(e.target.files?.[0])} />

      {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Extracting images…</div>}

      {images.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{images.length} image(s) extracted</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setFile(null); setImages([]) }} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-alt)', fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>← New File</button>
              <button onClick={() => images.forEach(download)} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>⬇ Download All</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
            {images.map(img => (
              <div key={img.page} style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'var(--surface)' }}>
                <img src={img.dataUrl} alt={`p${img.page}`} style={{ width: '100%', display: 'block', maxHeight: 160, objectFit: 'cover' }} />
                <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Page {img.page} · {img.w}×{img.h}</span>
                  <button onClick={() => download(img)} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}>⬇</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
