import React, { useState, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'

export default function RotateTool() {
  const { addToast } = useAppStore()
  const [file, setFile] = useState(null)
  const [pages, setPages] = useState([]) // [{canvas, rotation, idx}]
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)

  const loadPages = async (f) => {
    setFile(f); setLoading(true); setPages([])
    try {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
      const buf = await f.arrayBuffer()
      const doc = await pdfjsLib.getDocument({ data: buf }).promise
      const pageArr = []
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i)
        const vp = page.getViewport({ scale: 1 })
        const canvas = document.createElement('canvas')
        canvas.width = vp.width; canvas.height = vp.height
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise
        pageArr.push({ dataUrl: canvas.toDataURL(), rotation: 0, idx: i })
      }
      setPages(pageArr)
      addToast(`Loaded ${doc.numPages} pages`, 'ok')
    } catch (e) { addToast('Load failed: ' + e.message, 'err') }
    setLoading(false)
  }

  const rotate = (idx, dir) => {
    setPages(prev => prev.map(p => p.idx === idx ? { ...p, rotation: (p.rotation + dir + 360) % 360 } : p))
  }

  const rotateAll = (dir) => {
    setPages(prev => prev.map(p => ({ ...p, rotation: (p.rotation + dir + 360) % 360 })))
  }

  const save = async () => {
    if (!file) return
    setSaving(true)
    try {
      const { PDFDocument, degrees } = await import('pdf-lib')
      const buf = await file.arrayBuffer()
      const doc = await PDFDocument.load(buf)
      const pageObjs = doc.getPages()
      pages.forEach((p, i) => {
        if (p.rotation !== 0) {
          const pg = pageObjs[p.idx - 1]
          pg.setRotation(degrees(p.rotation))
        }
      })
      const bytes = await doc.save()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
      a.download = 'rotated_' + file.name; a.click()
      addToast('Downloaded!', 'ok')
    } catch (e) { addToast('Error: ' + e.message, 'err') }
    setSaving(false)
  }

  if (!file) return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 16px', textAlign: 'center' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Rotate & Reorder PDF</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>Fix orientation and rearrange pages effortlessly.</p>
      <div onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f?.type === 'application/pdf') loadPages(f) }}
        style={{ border: '2px dashed var(--border)', borderRadius: 16, padding: '56px 32px', cursor: 'pointer', background: 'var(--surface)' }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🔄</div>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Choose or drop a PDF</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Rotate individual pages or all at once</p>
      </div>
      <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => loadPages(e.target.files?.[0])} />
    </div>
  )

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Rotate Pages — {file.name}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => rotateAll(-90)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-alt)', fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>↺ All Left</button>
          <button onClick={() => rotateAll(90)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-alt)', fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>↻ All Right</button>
          <button onClick={() => { setFile(null); setPages([]) }} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-alt)', fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>← New File</button>
          <button onClick={save} disabled={saving} style={{ padding: '7px 20px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{saving ? 'Saving…' : '⬇ Download'}</button>
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading pages…</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 14 }}>
        {pages.map(p => (
          <div key={p.idx} style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'var(--surface)' }}>
            <div style={{ padding: 8, display: 'flex', justifyContent: 'center', background: '#f0f0f0' }}>
              <img src={p.dataUrl} alt={`p${p.idx}`}
                style={{ maxWidth: '100%', maxHeight: 140, objectFit: 'contain', transform: `rotate(${p.rotation}deg)`, transition: 'transform .25s', display: 'block' }} />
            </div>
            <div style={{ padding: '7px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Page {p.idx}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => rotate(p.idx, -90)} style={{ border: '1px solid var(--border)', borderRadius: 5, background: 'var(--bg-alt)', cursor: 'pointer', padding: '3px 7px', fontSize: 13 }}>↺</button>
                <button onClick={() => rotate(p.idx, 90)}  style={{ border: '1px solid var(--border)', borderRadius: 5, background: 'var(--bg-alt)', cursor: 'pointer', padding: '3px 7px', fontSize: 13 }}>↻</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
