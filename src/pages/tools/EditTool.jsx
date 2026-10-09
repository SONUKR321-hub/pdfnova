import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { extractWordsFromPage, detectScannedWordBoxes, ocrWordsFromCanvas, recognizeSingleWord } from '@/lib/pdf-word-extractor'

const FONTS = [
  { label: 'Sans Serif', value: 'Inter, system-ui, sans-serif' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Mono', value: '"Courier Prime", monospace' },
  { label: 'Handwriting', value: '"Caveat", cursive' },
  { label: 'Script', value: '"Dancing Script", cursive' },
  { label: 'Elegant', value: '"Playfair Display", serif' },
]

const PALETTE = [
  '#191816', '#B65C52', '#4A8BA8', '#6F8F7A', '#B58A4A', '#9B7FA8',
  '#2563EB', '#DC2626', '#16A34A', '#D97706', '#FFFFFF', '#FFFF00'
]

const TOOLS = [
  { id: 'edit_words',  label: 'Edit Words',  icon: '✏️', badge: 'Auto' },
  { id: 'select_area', label: 'Erase & Replace', icon: '✂️' },
  { id: 'select',      label: 'Select / Move', icon: '↖' },
  { id: 'text',        label: 'Add Text',    icon: 'T' },
  { id: 'draw',        label: 'Draw Pen',    icon: '🖊' },
  { id: 'highlight',   label: 'Highlight',   icon: '🖍' },
  { id: 'shapes',      label: 'Shapes',      icon: '◻' },
  { id: 'whiteout',    label: 'Whiteout',    icon: '▭' },
  { id: 'forms',       label: 'Form Field',  icon: '☐' },
  { id: 'check',       label: 'Checkmark',   icon: '✓' },
  { id: 'cross',       label: 'Cross',       icon: '✕' },
  { id: 'date',        label: 'Date Stamp',  icon: '📅' },
  { id: 'initials',    label: 'Initials',    icon: 'Aa' },
  { id: 'sign',        label: 'Signature',   icon: '✍' },
  { id: 'images',      label: 'Add Image',   icon: '🖼' },
  { id: 'watermark',   label: 'Watermark',   icon: '⚲' },
  { id: 'find_replace',label: 'Find & Replace', icon: '🔍' },
]

let _id = 1
const nextId = () => `item-${Date.now()}-${_id++}`

const btnStyle = (active) => ({
  background: active ? 'var(--accent-subtle)' : 'var(--bg-alt)',
  color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
  border: active ? '1px solid var(--border-focus)' : '1px solid var(--border)',
  borderRadius: 6, padding: '5px 10px', fontSize: 12,
  cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap',
})

const fieldStyle = {
  background: 'var(--bg-alt)', border: '1px solid var(--border)',
  borderRadius: 6, padding: '5px 8px', fontSize: 12,
  color: 'var(--text)', width: '100%', outline: 'none',
}

export default function EditTool() {
  const { addToast } = useAppStore()

  // PDF Document State
  const [file, setFile]                 = useState(null)
  const [pdfDoc, setPdfDoc]             = useState(null)
  const [numPages, setNumPages]         = useState(0)
  const [currentPage, setCurrentPage]   = useState(1)
  const [scale, setScale]               = useState(1.3)
  const [pageSize, setPageSize]         = useState({ w: 600, h: 800 })
  const [saving, setSaving]             = useState(false)
  const [isDrop, setIsDrop]             = useState(false)
  const [isLoadingPdf, setIsLoadingPdf] = useState(false)

  // Current Tool: defaults to 'edit_words' so every word is clickable and editable!
  const [activeTool, setActiveTool]     = useState('edit_words')
  const [shapeType, setShapeType]       = useState('rect')

  // Word-by-Word Editable Text State
  const [words, setWords]               = useState([]) // all extracted words for current file
  const [editingWordId, setEditingWordId] = useState(null)
  const [hoveredWordId, setHoveredWordId] = useState(null)
  const [isOcrRunning, setIsOcrRunning]   = useState(false)
  const [ocrStatus, setOcrStatus]         = useState('')

  // Added Annotations (Drawings, Signatures, Shapes, etc.)
  const [items, setItems]               = useState([])
  const [history, setHistory]           = useState([[]])
  const [histIdx, setHistIdx]           = useState(0)
  const [selectedId, setSelectedId]     = useState(null)

  // Text Styling State
  const [fontSize, setFontSize]         = useState(16)
  const [fontFamily, setFontFamily]     = useState(FONTS[0].value)
  const [color, setColor]               = useState('#191816')
  const [bold, setBold]                 = useState(false)
  const [italic, setItalic]             = useState(false)
  const [underline, setUnderline]       = useState(false)

  // Drawing State
  const [isDrawing, setIsDrawing]       = useState(false)
  const [drawPts, setDrawPts]           = useState([])
  const [drawColor, setDrawColor]       = useState('#B65C52')
  const [drawWidth, setDrawWidth]       = useState(3)

  // Watermark State
  const [wmText, setWmText]             = useState('CONFIDENTIAL')
  const [wmOpacity, setWmOpacity]       = useState(0.2)

  // Find & Replace
  const [findText, setFindText]         = useState('')
  const [replaceText, setReplaceText]   = useState('')

  // Signature Modal State
  const [showSign, setShowSign]         = useState(false)
  const [signMode, setSignMode]         = useState('draw')
  const [signText, setSignText]         = useState('')
  const [signFont, setSignFont]         = useState('"Dancing Script", cursive')
  const [signDrawing, setSignDrawing]   = useState(false)
  const [signDataUrl, setSignDataUrl]   = useState(null)

  // Dragging State
  const [dragging, setDragging]         = useState(null)

  // DOM Refs
  const canvasRef     = useRef(null)
  const overlayRef    = useRef(null)
  const fileInputRef  = useRef(null)
  const imgInputRef   = useRef(null)
  const signCanvasRef = useRef(null)
  const signUploadRef = useRef(null)
  const renderTaskRef = useRef(null)

  const currentPageWords = words.filter(w => w.page === currentPage)
  const currentItems     = items.filter(it => it.page === currentPage)
  const selectedItem     = items.find(it => it.id === selectedId) || null

  // ── History Helpers ───────────────────────────────────────────────
  const pushHistory = useCallback((next) => {
    setHistory(h => {
      const trimmed = h.slice(0, histIdx + 1)
      const arr = [...trimmed, next]
      if (arr.length > 30) arr.shift()
      return arr
    })
    setHistIdx(i => Math.min(i + 1, 29))
    setItems(next)
  }, [histIdx])

  const undo = useCallback(() => {
    if (histIdx <= 0) return
    const prev = history[histIdx - 1] || []
    setHistIdx(i => i - 1)
    setItems(prev)
    setSelectedId(null)
  }, [histIdx, history])

  const redo = useCallback(() => {
    if (histIdx >= history.length - 1) return
    const next = history[histIdx + 1] || []
    setHistIdx(i => i + 1)
    setItems(next)
    setSelectedId(null)
  }, [histIdx, history])

  // ── Load PDF via PDF.js ───────────────────────────────────────────
  const loadPDF = useCallback(async (f) => {
    if (!f) return
    setIsLoadingPdf(true)
    try {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}pdf.worker.min.mjs`

      const buf = await f.arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({ data: buf })
      const doc = await loadingTask.promise

      setPdfDoc(doc)
      setNumPages(doc.numPages)
      setCurrentPage(1)
      setItems([])
      setWords([])
      setHistory([[]])
      setHistIdx(0)
      setSelectedId(null)
      setEditingWordId(null)
      addToast(`Loaded "${f.name}" (${doc.numPages} pages)`, 'ok')
    } catch (e) {
      console.error('loadPDF error:', e)
      addToast('Could not load PDF: ' + e.message, 'err')
    } finally {
      setIsLoadingPdf(false)
    }
  }, [addToast])

  useEffect(() => {
    if (file) loadPDF(file)
  }, [file, loadPDF])

  // ── Render Page Canvas and Extract All Words ──────────────────────
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return
    let isCancelled = false

    const renderAndExtract = async () => {
      try {
        if (renderTaskRef.current) {
          try { renderTaskRef.current.cancel() } catch {}
          renderTaskRef.current = null
        }

        const page = await pdfDoc.getPage(currentPage)
        if (isCancelled) return

        const vp = page.getViewport({ scale })
        const canvas = canvasRef.current
        if (!canvas) return

        const w = Math.floor(vp.width)
        const h = Math.floor(vp.height)
        canvas.width = w
        canvas.height = h
        setPageSize({ w, h })

        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, w, h)

        const task = page.render({ canvasContext: ctx, viewport: vp })
        renderTaskRef.current = task
        await task.promise

        // Extract every word from this page!
        let extracted = await extractWordsFromPage(page, scale, currentPage)

        // If 0 words detected (scanned DocScanner document!), run instant computer vision word detector!
        if (extracted.length === 0 && canvas) {
          const baseVp = page.getViewport({ scale: 1 })
          const scannedWords = detectScannedWordBoxes(canvas, currentPage, baseVp.width, baseVp.height)
          if (scannedWords.length > 0) {
            extracted = scannedWords
            // Run background OCR to automatically transcribe text for every word box!
            ocrWordsFromCanvas(canvas, currentPage).then(ocrWords => {
              if (ocrWords && ocrWords.length > 0 && !isCancelled) {
                setWords(prev => {
                  const other = prev.filter(w => w.page !== currentPage)
                  return [...other, ...ocrWords]
                })
              }
            }).catch(console.error)
          }
        }

        if (!isCancelled) {
          setWords(prev => {
            // Keep existing modified words for other pages, replace current page words
            const otherPagesWords = prev.filter(w => w.page !== currentPage)
            return [...otherPagesWords, ...extracted]
          })
          if (extracted.length > 0) {
            addToast(`Detected ${extracted.length} editable words on page ${currentPage}`, 'ok')
          }
        }
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Render/Extract error:', err)
        }
      }
    }

    renderAndExtract()

    return () => {
      isCancelled = true
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel() } catch {}
      }
    }
  }, [pdfDoc, currentPage, scale, addToast])

  // ── OCR Fallback for Scanned PDFs (e.g. DocScanner) ────────────────
  const runOcrOnCurrentPage = async () => {
    if (!canvasRef.current) return
    setIsOcrRunning(true)
    setOcrStatus('Initializing OCR engine…')
    try {
      const ocrWords = await ocrWordsFromCanvas(canvasRef.current, currentPage, (status) => {
        setOcrStatus(status)
      })

      if (ocrWords.length > 0) {
        setWords(prev => {
          const otherPages = prev.filter(w => w.page !== currentPage)
          return [...otherPages, ...ocrWords]
        })
        addToast(`OCR detected ${ocrWords.length} words on page ${currentPage}!`, 'ok')
      } else {
        addToast('No words recognized on this page.', 'info')
      }
    } catch (e) {
      console.error('OCR run failed:', e)
      addToast('OCR scan failed: ' + e.message, 'err')
    } finally {
      setIsOcrRunning(false)
      setOcrStatus('')
    }
  }

  // ── Coordinates Helper ───────────────────────────────────────────
  const getPos = (e) => {
    if (!overlayRef.current) return { x: 0, y: 0 }
    const rect = overlayRef.current.getBoundingClientRect()
    return {
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
    }
  }

  // ── Word Editing Handlers ─────────────────────────────────────────
  const handleWordClick = async (word, e) => {
    e.stopPropagation()
    setEditingWordId(word.id)
    setSelectedId(null)

    // If word is scanned and has no text recognized yet, recognize it on demand!
    if (word.isScanned && (!word.text || word.text === '')) {
      if (canvasRef.current) {
        const recognized = await recognizeSingleWord(canvasRef.current, word)
        if (recognized) {
          setWords(prev => prev.map(w => w.id === word.id ? { ...w, text: recognized, origText: recognized } : w))
        }
      }
    }
  }

  const handleWordChange = (wordId, newText) => {
    setWords(prev => prev.map(w => {
      if (w.id === wordId) {
        return {
          ...w,
          text: newText,
          isEdited: true,
          isDeleted: false,
        }
      }
      return w
    }))
  }

  const handleWordDelete = (wordId, e) => {
    e?.stopPropagation()
    setWords(prev => prev.map(w => {
      if (w.id === wordId) {
        return { ...w, isDeleted: true, isEdited: true, text: '' }
      }
      return w
    }))
    setEditingWordId(null)
    addToast('Word erased with whiteout', 'ok')
  }

  const handleWordRestore = (wordId, e) => {
    e?.stopPropagation()
    setWords(prev => prev.map(w => {
      if (w.id === wordId) {
        return { ...w, text: w.origText, isDeleted: false, isEdited: false }
      }
      return w
    }))
    addToast('Word restored', 'ok')
  }

  // ── Tool Actions (Pointer Down on Overlay) ────────────────────────
  const handlePointerDown = (e) => {
    // If clicking outside while editing a word, commit it
    if (editingWordId) {
      setEditingWordId(null)
    }

    if (activeTool === 'select' || activeTool === 'edit_words') {
      setSelectedId(null)
      return
    }

    const pos = getPos(e)
    e.preventDefault()

    if (activeTool === 'draw' || activeTool === 'highlight') {
      setIsDrawing(true)
      setDrawPts([pos])
      return
    }

    if (activeTool === 'select_area') {
      const item = {
        id: nextId(), page: currentPage, type: 'whiteout_text',
        x: pos.x, y: pos.y, w: 140, h: 32, text: '',
        color: '#191816', fontSize: 16, fontFamily,
      }
      pushHistory([...items, item])
      setSelectedId(item.id)
      setDragging({ id: item.id, mode: 'resize', ox: pos.x, oy: pos.y })
      return
    }

    if (activeTool === 'shapes') {
      const item = {
        id: nextId(), page: currentPage, type: 'shape',
        shapeType, x: pos.x, y: pos.y, w: 120, h: 80, color,
      }
      pushHistory([...items, item])
      setSelectedId(item.id)
      setActiveTool('select')
      return
    }

    if (activeTool === 'whiteout') {
      const item = {
        id: nextId(), page: currentPage, type: 'whiteout',
        x: pos.x, y: pos.y, w: 140, h: 32,
      }
      pushHistory([...items, item])
      setSelectedId(item.id)
      setActiveTool('select')
      return
    }

    if (activeTool === 'text') {
      const item = {
        id: nextId(), page: currentPage, type: 'text',
        x: pos.x, y: pos.y, text: 'Click to type',
        fontSize, fontFamily, color, bold, italic, underline,
        w: 180, h: 36,
      }
      pushHistory([...items, item])
      setSelectedId(item.id)
      setActiveTool('select')
      return
    }

    if (activeTool === 'forms') {
      const item = {
        id: nextId(), page: currentPage, type: 'form',
        x: pos.x, y: pos.y, w: 180, h: 30, value: '',
      }
      pushHistory([...items, item])
      setSelectedId(item.id)
      setActiveTool('select')
      return
    }

    const STAMPS = {
      check:       { text: '✓',   fontSize: 28, color: '#16A34A', w: 36, h: 36 },
      cross:       { text: '✕',   fontSize: 28, color: '#DC2626', w: 36, h: 36 },
      date:        { text: new Date().toLocaleDateString(), fontSize: 13, color, w: 120, h: 26 },
      initials:    { text: 'Initials', fontSize: 18, fontFamily: '"Caveat", cursive', color, w: 100, h: 30 },
    }

    if (STAMPS[activeTool]) {
      const item = {
        id: nextId(), page: currentPage, type: activeTool,
        x: pos.x, y: pos.y, ...STAMPS[activeTool],
      }
      pushHistory([...items, item])
      setSelectedId(item.id)
      setActiveTool('select')
      return
    }

    if (activeTool === 'watermark') {
      const item = {
        id: nextId(), page: currentPage, type: 'watermark',
        x: Math.max(20, Math.round(pageSize.w / 2 - 120)),
        y: Math.max(20, Math.round(pageSize.h / 2 - 30)),
        text: wmText, opacity: wmOpacity, fontSize: 38, color: '#333333',
        w: 300, h: 60,
      }
      pushHistory([...items, item])
      setSelectedId(item.id)
      setActiveTool('select')
      return
    }

    if (activeTool === 'sign') {
      setShowSign(true)
      return
    }

    if (activeTool === 'images') {
      imgInputRef.current?.click()
      return
    }
  }

  const handlePointerMove = (e) => {
    if (isDrawing) {
      e.preventDefault()
      setDrawPts(pts => [...pts, getPos(e)])
      return
    }
    if (dragging) {
      e.preventDefault()
      const pos = getPos(e)
      setItems(prev => prev.map(it => {
        if (it.id !== dragging.id) return it
        if (dragging.mode === 'move') {
          return { ...it, x: pos.x - dragging.ox, y: pos.y - dragging.oy }
        }
        if (dragging.mode === 'resize') {
          return {
            ...it,
            w: Math.max(20, pos.x - it.x),
            h: Math.max(16, pos.y - it.y),
          }
        }
        return it
      }))
    }
  }

  const handlePointerUp = () => {
    if (isDrawing) {
      if (drawPts.length > 1) {
        const item = {
          id: nextId(), page: currentPage,
          type: activeTool === 'highlight' ? 'highlight' : 'draw',
          points: drawPts,
          color: activeTool === 'highlight' ? '#FFFF00' : drawColor,
          width: drawWidth,
          opacity: activeTool === 'highlight' ? 0.38 : 1,
        }
        pushHistory([...items, item])
      }
      setIsDrawing(false)
      setDrawPts([])
      return
    }
    if (dragging) {
      setDragging(null)
      pushHistory(items)
    }
  }

  // ── Drag & Resize Handlers ────────────────────────────────────────
  const startDrag = (e, id) => {
    e.stopPropagation()
    setSelectedId(id)

    if (
      e.target.isContentEditable ||
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA'
    ) {
      return
    }

    const item = items.find(it => it.id === id)
    if (!item || !overlayRef.current) return
    const rect = overlayRef.current.getBoundingClientRect()
    setDragging({
      id, mode: 'move',
      ox: e.clientX - rect.left - item.x,
      oy: e.clientY - rect.top - item.y,
    })
    e.preventDefault()
  }

  const startResize = (e, id) => {
    e.stopPropagation()
    setSelectedId(id)
    setDragging({ id, mode: 'resize' })
    e.preventDefault()
  }

  const deleteSelected = () => {
    if (!selectedId) return
    pushHistory(items.filter(it => it.id !== selectedId))
    setSelectedId(null)
  }

  // ── Save & Download PDF (Erases Original Words & Draws Edits) ─────
  const savePDF = async () => {
    if (!file) return
    setSaving(true)
    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib')
      const buf = await file.arrayBuffer()
      const doc = await PDFDocument.load(buf)
      const helv = await doc.embedFont(StandardFonts.Helvetica)
      const helvBold = await doc.embedFont(StandardFonts.HelveticaBold)
      const pages = doc.getPages()

      const hexToRgb = (hex) => {
        const h = (hex || '#191816').replace('#', '')
        return rgb(
          parseInt(h.slice(0, 2), 16) / 255,
          parseInt(h.slice(2, 4), 16) / 255,
          parseInt(h.slice(4, 6), 16) / 255
        )
      }

      // 1. Process all modified / erased words across all pages
      for (const w of words) {
        if (!w.isEdited && !w.isDeleted) continue
        const pg = pages[w.page - 1]
        if (!pg) continue

        const { height: ph } = pg.getSize()
        // Compute PDF coordinate positions
        const pdfX = w.pdfX
        // In PDF coordinate space, Y starts from bottom-left
        const pdfY = w.pdfY
        const pdfW = w.pdfW
        const pdfH = Math.max(w.pdfH, w.fontSize || 12)

        // Draw a clean white rectangle over the original word to erase it!
        pg.drawRectangle({
          x: pdfX - 1,
          y: pdfY - 2,
          width: Math.max(pdfW + 2, 8),
          height: Math.max(pdfH + 4, 10),
          color: rgb(1, 1, 1),
        })

        // If not deleted and has replacement text, draw the new edited word!
        if (!w.isDeleted && w.text.trim()) {
          const cleanTxt = w.text.replace(/[^\x20-\x7E]/g, '')
          if (cleanTxt) {
            pg.drawText(cleanTxt, {
              x: pdfX,
              y: pdfY,
              size: Math.max(w.fontSize || 12, 6),
              font: helv,
              color: hexToRgb(w.color || '#191816'),
            })
          }
        }
      }

      // 2. Process all overlay items (signatures, drawings, shapes, text, etc.)
      for (const it of items) {
        const pg = pages[it.page - 1]
        if (!pg) continue

        const { width: pw, height: ph } = pg.getSize()
        const sx = pw / pageSize.w
        const sy = ph / pageSize.h
        const px = it.x * sx
        const py = ph - it.y * sy

        if (it.type === 'check') {
          const s = (it.fontSize || 24) * sx
          const c = hexToRgb(it.color || '#16A34A')
          pg.drawLine({
            start: { x: px, y: py - s * 0.6 },
            end:   { x: px + s * 0.35, y: py - s },
            color: c, thickness: 2.8 * sx,
          })
          pg.drawLine({
            start: { x: px + s * 0.35, y: py - s },
            end:   { x: px + s * 0.9, y: py - s * 0.2 },
            color: c, thickness: 2.8 * sx,
          })
        } else if (it.type === 'cross') {
          const s = (it.fontSize || 24) * sx
          const c = hexToRgb(it.color || '#DC2626')
          pg.drawLine({
            start: { x: px, y: py - s * 0.2 },
            end:   { x: px + s * 0.8, y: py - s },
            color: c, thickness: 2.8 * sx,
          })
          pg.drawLine({
            start: { x: px, y: py - s },
            end:   { x: px + s * 0.8, y: py - s * 0.2 },
            color: c, thickness: 2.8 * sx,
          })
        } else if (
          it.type === 'text' || it.type === 'date' || it.type === 'initials' ||
          it.type === 'watermark'
        ) {
          const fs = Math.max((it.fontSize || 14) * sx, 5)
          const font = it.bold ? helvBold : helv
          const txt = (it.text || '').replace(/[^\x20-\x7E]/g, '')
          if (txt) {
            pg.drawText(txt, {
              x: px, y: py - fs,
              size: fs, font,
              color: hexToRgb(it.color),
              opacity: it.opacity ?? 1,
            })
          }
        } else if (it.type === 'form') {
          const w = (it.w || 180) * sx
          const h = (it.h || 30) * sy
          pg.drawRectangle({
            x: px, y: py - h, width: w, height: h,
            borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 1,
          })
          if (it.value) {
            const cleanVal = it.value.replace(/[^\x20-\x7E]/g, '')
            pg.drawText(cleanVal, {
              x: px + 4 * sx, y: py - h + 6 * sy,
              size: 11 * sx, font: helv, color: rgb(0.1, 0.09, 0.09),
            })
          }
        } else if (it.type === 'whiteout' || it.type === 'whiteout_text') {
          const w = (it.w || 140) * sx
          const h = (it.h || 32) * sy
          pg.drawRectangle({
            x: px, y: py - h, width: w, height: h,
            color: rgb(1, 1, 1),
          })
          if (it.type === 'whiteout_text' && it.text) {
            const cleanTxt = it.text.replace(/[^\x20-\x7E]/g, '')
            if (cleanTxt) {
              pg.drawText(cleanTxt, {
                x: px + 3 * sx, y: py - h + 6 * sy,
                size: Math.max((it.fontSize || 14) * sx, 5),
                font: helv,
                color: hexToRgb(it.color),
              })
            }
          }
        } else if (it.type === 'shape') {
          const w = Math.abs((it.w || 120) * sx)
          const h = Math.abs((it.h || 80) * sy)
          const c = hexToRgb(it.color)
          if (it.shapeType === 'circle') {
            pg.drawEllipse({
              x: px + w / 2, y: py - h / 2,
              xScale: w / 2, yScale: h / 2,
              borderColor: c, borderWidth: 2 * sx,
            })
          } else if (it.shapeType === 'line' || it.shapeType === 'arrow') {
            pg.drawLine({
              start: { x: px, y: py },
              end:   { x: px + (it.w || 120) * sx, y: py - (it.h || 80) * sy },
              color: c, thickness: 2 * sx,
            })
          } else {
            pg.drawRectangle({
              x: px, y: py - h, width: w, height: h,
              borderColor: c, borderWidth: 2 * sx,
            })
          }
        } else if (it.type === 'draw' || it.type === 'highlight') {
          if (it.points?.length > 1) {
            const c = hexToRgb(it.color.startsWith('#') ? it.color : '#B65C52')
            for (let i = 0; i < it.points.length - 1; i++) {
              pg.drawLine({
                start: { x: it.points[i].x * sx,     y: ph - it.points[i].y * sy },
                end:   { x: it.points[i + 1].x * sx, y: ph - it.points[i + 1].y * sy },
                color: c,
                thickness: (it.width || 2) * sx,
                opacity: it.opacity ?? 1,
              })
            }
          }
        } else if ((it.type === 'sign' || it.type === 'images') && it.dataUrl) {
          try {
            const raw   = it.dataUrl.replace(/^data:image\/(png|jpeg);base64,/, '')
            const bytes = Uint8Array.from(atob(raw), c => c.charCodeAt(0))
            const img   = it.dataUrl.startsWith('data:image/jpeg')
              ? await doc.embedJpg(bytes)
              : await doc.embedPng(bytes)
            const sw = (it.w || 160) * sx
            const sh = (it.h || 80) * sy
            pg.drawImage(img, { x: px, y: py - sh, width: sw, height: sh })
          } catch (e) {
            console.error('Image embed error:', e)
          }
        }
      }

      const outBytes = await doc.save()
      const blob = new Blob([outBytes], { type: 'application/pdf' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'edited_' + file.name
      a.click()
      addToast('PDF downloaded! All edited words replaced successfully.', 'ok')
    } catch (e) {
      console.error('savePDF error:', e)
      addToast('Save failed: ' + e.message, 'err')
    } finally {
      setSaving(false)
    }
  }

  // ── Signature Drawing Handlers ────────────────────────────────────
  const signDraw = (e) => {
    if (!signDrawing) return
    const ctx = signCanvasRef.current?.getContext('2d')
    const r   = signCanvasRef.current?.getBoundingClientRect()
    if (!ctx || !r) return
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top)
    ctx.strokeStyle = '#191816'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  const signStart = (e) => {
    setSignDrawing(true)
    const ctx = signCanvasRef.current?.getContext('2d')
    const r   = signCanvasRef.current?.getBoundingClientRect()
    if (ctx && r) {
      ctx.beginPath()
      ctx.moveTo(e.clientX - r.left, e.clientY - r.top)
    }
  }

  const clearSignCanvas = () => {
    const ctx = signCanvasRef.current?.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, 440, 130)
    setSignDataUrl(null)
  }

  const applySignature = () => {
    let dataUrl = null
    if (signMode === 'draw') {
      dataUrl = signCanvasRef.current?.toDataURL('image/png')
    } else if (signMode === 'type' && signText) {
      const c = document.createElement('canvas')
      c.width = 440; c.height = 120
      const ctx = c.getContext('2d')
      ctx.font = `52px ${signFont}`
      ctx.fillStyle = '#191816'
      ctx.fillText(signText, 16, 80)
      dataUrl = c.toDataURL('image/png')
    } else if (signMode === 'upload' && signDataUrl) {
      dataUrl = signDataUrl
    }

    if (!dataUrl) return

    const item = {
      id: nextId(), page: currentPage, type: 'sign', dataUrl,
      x: Math.max(20, Math.round(pageSize.w / 2 - 80)),
      y: Math.max(20, Math.round(pageSize.h / 2 - 40)),
      w: 160, h: 70,
    }
    pushHistory([...items, item])
    setSelectedId(item.id)
    setShowSign(false)
  }

  const handleImageUpload = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = ev => {
      const item = {
        id: nextId(), page: currentPage, type: 'images',
        dataUrl: ev.target.result,
        x: Math.max(20, Math.round(pageSize.w / 2 - 100)),
        y: Math.max(20, Math.round(pageSize.h / 2 - 75)),
        w: 200, h: 150,
      }
      pushHistory([...items, item])
      setSelectedId(item.id)
    }
    reader.readAsDataURL(f)
    e.target.value = ''
  }

  const handleFindReplace = () => {
    if (!findText) return
    let replacedCount = 0
    // Replace in extracted words!
    setWords(prev => prev.map(w => {
      if (w.text.includes(findText)) {
        replacedCount++
        return {
          ...w,
          text: w.text.replaceAll(findText, replaceText),
          isEdited: true,
        }
      }
      return w
    }))

    // Also replace in added annotations
    setItems(prev => prev.map(it => {
      if (it.type === 'text' && (it.text || '').includes(findText)) {
        return { ...it, text: it.text.replaceAll(findText, replaceText) }
      }
      if (it.type === 'form' && (it.value || '').includes(findText)) {
        return { ...it, value: it.value.replaceAll(findText, replaceText) }
      }
      return it
    }))

    addToast(`Replaced ${replacedCount} occurrence(s) in document!`, 'ok')
  }

  // SVG Path from coordinates array
  const pts2path = (pts) =>
    pts?.length > 1 ? pts.reduce((a, p, i) => a + (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`), '') : ''

  // Keyboard Shortcuts
  useEffect(() => {
    const h = (e) => {
      if (editingWordId != null) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.contentEditable === 'true') {
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected()
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo() }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault(); redo()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [selectedId, undo, redo])

  const getCursor = () => {
    if (activeTool === 'edit_words') return 'text'
    if (activeTool === 'draw' || activeTool === 'highlight') return 'crosshair'
    if (activeTool === 'text') return 'text'
    if (activeTool === 'select') return 'default'
    return 'crosshair'
  }

  // ── DROP ZONE ─────────────────────────────────────────────────────
  if (!file) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '78vh', padding: 32, gap: 28 }}>
        <div
          onDragOver={e => { e.preventDefault(); setIsDrop(true) }}
          onDragLeave={() => setIsDrop(false)}
          onDrop={e => {
            e.preventDefault()
            setIsDrop(false)
            const f = e.dataTransfer.files?.[0]
            if (f?.type === 'application/pdf') setFile(f)
          }}
          style={{
            background: 'var(--surface)',
            border: `2px dashed ${isDrop ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 20, padding: '56px 48px', textAlign: 'center',
            maxWidth: 540, width: '100%',
            transform: isDrop ? 'scale(1.013)' : 'scale(1)',
            transition: 'all .18s',
            boxShadow: isDrop ? '0 0 0 4px var(--accent-subtle)' : 'none',
          }}
        >
          <div style={{ fontSize: 52, marginBottom: 16 }}>📄</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            Full Word-by-Word PDF Editor
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.65, maxWidth: 400, margin: '0 auto 24px' }}>
            Every word in your PDF is automatically converted into editable text. Click and edit any word, erase with whiteout, or type new text. 100% Free &amp; Private.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'var(--accent)', color: '#fff', border: 'none',
              borderRadius: 10, padding: '13px 32px', fontSize: 15, fontWeight: 600,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            📂 Choose PDF File
          </button>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 12 }}>
            or drag &amp; drop a PDF here (scanned &amp; digital supported)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f) }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, maxWidth: 540, width: '100%' }}>
          {[
            { icon: '✏️', title: 'Edit Any Word', desc: 'Click existing text to change or replace it' },
            { icon: '🔍', title: 'Scanned PDF OCR', desc: 'Auto-detect words on DocScanner PDFs' },
            { icon: '✍', title: 'Sign Document', desc: 'Draw, type or upload your signature' },
            { icon: '✓', title: 'Checkmarks & Cross', desc: 'Stamp checkboxes and dates' },
            { icon: '▭', title: 'Whiteout & Erase', desc: 'Cover unwanted text cleanly' },
            { icon: '🔒', title: 'Zero Cloud Upload', desc: 'Runs 100% inside your browser' },
          ].map(f => (
            <div key={f.title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{f.title}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── MAIN EDITOR VIEW ──────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden', userSelect: 'none' }}>

      {/* ── TOP TOOLBAR ── */}
      <div style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6,
        flexShrink: 0, flexWrap: 'wrap', zIndex: 10,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {file.name}
        </span>

        <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />

        {/* Word Mode Toggle Indicator */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: activeTool === 'edit_words' ? 'var(--accent-subtle)' : 'var(--bg-alt)',
          border: `1px solid ${activeTool === 'edit_words' ? 'var(--border-focus)' : 'var(--border)'}`,
          padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          color: activeTool === 'edit_words' ? 'var(--accent-text)' : 'var(--text-secondary)',
          cursor: 'pointer',
        }}
          onClick={() => setActiveTool('edit_words')}
          title="Click any word on the document to edit or replace it!"
        >
          <span>✏️ Edit Existing Words</span>
          <span style={{ background: 'var(--accent)', color: '#fff', fontSize: 10, padding: '1px 5px', borderRadius: 4 }}>
            {currentPageWords.length} words
          </span>
        </div>

        {/* OCR Button for Scanned / DocScanner PDFs */}
        <button
          onClick={runOcrOnCurrentPage}
          disabled={isOcrRunning}
          style={{
            ...btnStyle(false),
            background: isOcrRunning ? 'var(--accent-subtle)' : 'var(--surface)',
            border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: 5,
          }}
          title="Detect words from scanned images or photos using optical character recognition"
        >
          <span>🔍</span>
          <span>{isOcrRunning ? ocrStatus || 'Scanning…' : 'Scan Page Words (OCR)'}</span>
        </button>

        <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />

        <button onClick={undo} style={btnStyle(false)} title="Undo (Ctrl+Z)">↩ Undo</button>
        <button onClick={redo} style={btnStyle(false)} title="Redo (Ctrl+Y)">↪ Redo</button>

        <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />

        {/* Page Nav */}
        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} style={btnStyle(false)}>◀</button>
        <span style={{ fontSize: 12, color: 'var(--text)', minWidth: 80, textAlign: 'center', fontWeight: 500 }}>
          Page {currentPage} / {numPages}
        </span>
        <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage >= numPages} style={btnStyle(false)}>▶</button>

        <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />

        {/* Zoom */}
        <button onClick={() => setScale(s => Math.max(0.4, +(s - 0.15).toFixed(2)))} style={btnStyle(false)}>−</button>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 42, textAlign: 'center' }}>
          {Math.round(scale * 100)}%
        </span>
        <button onClick={() => setScale(s => Math.min(3.5, +(s + 0.15).toFixed(2)))} style={btnStyle(false)}>+</button>
        <button onClick={() => setScale(1.3)} style={{ ...btnStyle(false), fontSize: 11 }}>Reset</button>

        <div style={{ flex: 1 }} />

        {selectedId && (
          <button onClick={deleteSelected} style={{ ...btnStyle(false), color: 'var(--danger)', borderColor: 'var(--danger)' }}>
            🗑 Delete
          </button>
        )}

        <button
          onClick={() => { setFile(null); setPdfDoc(null); setItems([]); setWords([]); setSelectedId(null) }}
          style={btnStyle(false)}
        >
          ← Choose Another
        </button>

        <button
          onClick={savePDF}
          disabled={saving}
          style={{
            background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 8, padding: '7px 22px', fontSize: 13, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            boxShadow: '0 2px 6px rgba(181,138,74,0.3)',
          }}
        >
          {saving ? 'Saving…' : '⬇ Download PDF'}
        </button>
      </div>

      {/* ── EDITOR BODY ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── LEFT: Tool Palette ── */}
        <div style={{
          width: 196, background: 'var(--surface)', borderRight: '1px solid var(--border)',
          overflowY: 'auto', flexShrink: 0, padding: '10px 8px', display: 'flex',
          flexDirection: 'column', gap: 3,
        }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', padding: '4px 8px', marginBottom: 2 }}>
            Tools
          </div>

          {TOOLS.map(t => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTool(t.id)
                if (t.id === 'images') imgInputRef.current?.click()
                if (t.id === 'sign') setShowSign(true)
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                background: activeTool === t.id ? 'var(--accent-subtle)' : 'transparent',
                border: activeTool === t.id ? '1px solid var(--border-focus)' : '1px solid transparent',
                borderRadius: 7, cursor: 'pointer', fontSize: 12.5, fontWeight: 500,
                color: activeTool === t.id ? 'var(--accent-text)' : 'var(--text-secondary)',
                textAlign: 'left', transition: 'all .12s',
              }}
            >
              <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>{t.icon}</span>
              <span style={{ flex: 1 }}>{t.label}</span>
              {t.badge && (
                <span style={{ fontSize: 9.5, background: 'var(--accent)', color: '#fff', padding: '1px 4px', borderRadius: 3 }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}

          {/* Sub-tool Options */}
          <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />

          {activeTool === 'edit_words' && (
            <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>
                Word Editing Tips:
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                • <strong>Click any word</strong> directly on the page to change its text.
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                • Hit <strong>Backspace/Delete</strong> inside the box to erase words with whiteout.
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                • If scanned, use <strong>Scan Page Words (OCR)</strong> above.
              </p>
            </div>
          )}

          {activeTool === 'shapes' && (
            <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Shape</div>
              {['rect', 'circle', 'line', 'arrow'].map(s => (
                <button key={s} onClick={() => setShapeType(s)} style={{ ...btnStyle(shapeType === s), textTransform: 'capitalize' }}>{s}</button>
              ))}
            </div>
          )}

          {(activeTool === 'text' || activeTool === 'edit_words') && (
            <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>Font Style</div>
              <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} style={fieldStyle}>
                {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Size</label>
                <input type="number" value={fontSize} min={8} max={120} onChange={e => setFontSize(+e.target.value)} style={{ ...fieldStyle, width: 56 }} />
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setBold(b => !b)} style={{ ...btnStyle(bold), fontWeight: 700 }}>B</button>
                <button onClick={() => setItalic(i => !i)} style={{ ...btnStyle(italic), fontStyle: 'italic' }}>I</button>
                <button onClick={() => setUnderline(u => !u)} style={{ ...btnStyle(underline), textDecoration: 'underline' }}>U</button>
              </div>
            </div>
          )}

          {(activeTool === 'draw' || activeTool === 'highlight') && (
            <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>Brush Width</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <input type="range" min={1} max={20} value={drawWidth} onChange={e => setDrawWidth(+e.target.value)} style={{ flex: 1 }} />
                <span style={{ fontSize: 11, minWidth: 20 }}>{drawWidth}</span>
              </div>
            </div>
          )}

          {activeTool === 'watermark' && (
            <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>Watermark Text</div>
              <input value={wmText} onChange={e => setWmText(e.target.value)} placeholder="Text…" style={fieldStyle} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Opacity</label>
                <input type="range" min={0.05} max={0.9} step={0.05} value={wmOpacity} onChange={e => setWmOpacity(+e.target.value)} style={{ flex: 1 }} />
              </div>
            </div>
          )}

          {activeTool === 'find_replace' && (
            <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>Find & Replace</div>
              <input value={findText} onChange={e => setFindText(e.target.value)} placeholder="Find…" style={fieldStyle} />
              <input value={replaceText} onChange={e => setReplaceText(e.target.value)} placeholder="Replace with…" style={fieldStyle} />
              <button onClick={handleFindReplace} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>
                Replace All Words
              </button>
            </div>
          )}

          {/* Color Palette */}
          <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
          <div style={{ padding: '0 8px' }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
              Color
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
              {PALETTE.map(c => (
                <div
                  key={c}
                  onClick={() => { setColor(c); setDrawColor(c) }}
                  style={{
                    width: 20, height: 20, borderRadius: '50%', background: c,
                    border: color === c ? '2.5px solid var(--accent)' : '1.5px solid var(--border)',
                    cursor: 'pointer', boxShadow: c === '#FFFFFF' ? 'inset 0 0 0 1px #ccc' : 'none',
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
            <input
              type="color"
              value={color}
              onChange={e => { setColor(e.target.value); setDrawColor(e.target.value) }}
              title="Custom color"
              style={{ width: '100%', height: 26, border: '1px solid var(--border)', borderRadius: 6, padding: 1, cursor: 'pointer', background: 'none' }}
            />
          </div>
        </div>

        {/* ── CENTER: Canvas & Word-by-Word Editable Layer ── */}
        <div style={{
          flex: 1, overflow: 'auto', background: '#555',
          display: 'flex', justifyContent: 'center', padding: 24,
        }}>
          {isLoadingPdf ? (
            <div style={{ color: '#fff', alignSelf: 'center', fontSize: 15, display: 'flex', gap: 10, alignItems: 'center' }}>
              <span>Loading document…</span>
            </div>
          ) : (
            <div style={{
              position: 'relative',
              width: pageSize.w,
              height: pageSize.h,
              boxShadow: '0 12px 36px rgba(0,0,0,.45)',
              flexShrink: 0,
              background: '#fff',
              alignSelf: 'flex-start',
            }}>
              {/* PDF Background Canvas */}
              <canvas ref={canvasRef} style={{ display: 'block', width: pageSize.w, height: pageSize.h }} />

              {/* ── WORD-BY-WORD INTERACTIVE EDITING LAYER ── */}
              <div
                style={{
                  position: 'absolute', inset: 0,
                  pointerEvents: activeTool === 'edit_words' ? 'auto' : 'none',
                }}
              >
                {currentPageWords.map(w => {
                  const isEditing = editingWordId === w.id
                  const isHovered = hoveredWordId === w.id
                  const isDeleted = w.isDeleted

                  // If deleted, render clean whiteout covering the original word
                  if (isDeleted) {
                    return (
                      <div
                        key={w.id}
                        style={{
                          position: 'absolute',
                          left: w.screenX - 1,
                          top: w.screenTopY - 1,
                          width: w.screenWidth + 2,
                          height: w.screenHeight + 2,
                          background: '#FFFFFF',
                          border: '1px dashed #E5E7EB',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          zIndex: 5,
                        }}
                        title={`Erased "${w.origText}". Click to restore.`}
                        onClick={(e) => handleWordRestore(w.id, e)}
                      >
                        <span style={{ fontSize: 9, color: '#9CA3AF' }}>✕</span>
                      </div>
                    )
                  }

                  // If this word is currently being edited inline
                  if (isEditing) {
                    return (
                      <div
                        key={w.id}
                        style={{
                          position: 'absolute',
                          left: w.screenX - 2,
                          top: w.screenTopY - 2,
                          zIndex: 20,
                          background: '#FFFFFF',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                          borderRadius: 4,
                          border: '2px solid var(--accent)',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <input
                          autoFocus
                          value={w.text != null ? w.text : ''}
                          placeholder="Type word…"
                          onChange={e => handleWordChange(w.id, e.target.value)}
                          onKeyDown={e => {
                            e.stopPropagation()
                            if (e.key === 'Enter') setEditingWordId(null)
                            if (e.key === 'Escape') {
                              handleWordChange(w.id, w.origText)
                              setEditingWordId(null)
                            }
                          }}
                          style={{
                            fontFamily: w.fontFamily || fontFamily,
                            fontSize: Math.max(w.fontSize || 14, 11),
                            color: w.color || color,
                            fontWeight: bold ? 700 : 400,
                            fontStyle: italic ? 'italic' : 'normal',
                            border: 'none',
                            outline: 'none',
                            padding: '1px 4px',
                            minWidth: Math.max(w.screenWidth, 60),
                            background: '#FFFFFF',
                          }}
                        />
                        <button
                          onClick={e => handleWordDelete(w.id, e)}
                          title="Erase this word"
                          style={{
                            background: 'none', border: 'none', color: 'var(--danger)',
                            cursor: 'pointer', fontSize: 11, padding: '2px 5px',
                          }}
                        >
                          🗑
                        </button>
                      </div>
                    )
                  }

                  // Word in normal or edited state
                  return (
                    <div
                      key={w.id}
                      onMouseEnter={() => setHoveredWordId(w.id)}
                      onMouseLeave={() => setHoveredWordId(null)}
                      onClick={(e) => handleWordClick(w, e)}
                      style={{
                        position: 'absolute',
                        left: w.screenX,
                        top: w.screenTopY,
                        width: Math.max(w.screenWidth, 10),
                        height: Math.max(w.screenHeight, 12),
                        cursor: activeTool === 'edit_words' ? 'text' : 'default',
                        // If edited, show white background covering original word and render new text
                        background: w.isEdited ? '#FFFFFF' : (isHovered && activeTool === 'edit_words' ? 'rgba(181,138,74,0.15)' : 'transparent'),
                        border: isHovered && activeTool === 'edit_words' ? '1px dashed var(--accent)' : (w.isEdited ? '1px solid var(--accent)' : 'none'),
                        borderRadius: 2,
                        zIndex: 4,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title={activeTool === 'edit_words' ? `Click to edit "${w.text}"` : undefined}
                    >
                      {w.isEdited && (
                        <span style={{
                          fontFamily: w.fontFamily || fontFamily,
                          fontSize: Math.max(w.fontSize || 14, 11),
                          color: w.color || color,
                          whiteSpace: 'nowrap',
                          lineHeight: 1,
                        }}>
                          {w.text}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* ── ANNOTATIONS & DRAWING SVG OVERLAY ── */}
              <svg
                ref={overlayRef}
                style={{
                  position: 'absolute', inset: 0,
                  width: pageSize.w, height: pageSize.h,
                  cursor: getCursor(), touchAction: 'none',
                  pointerEvents: activeTool === 'edit_words' ? 'none' : 'auto',
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                {/* Rendered Items */}
                {currentItems.map(it => {
                  const isSel = it.id === selectedId
                  const selOutline = isSel ? '1.5px dashed var(--accent)' : 'none'

                  // Draw / Highlight
                  if (it.type === 'draw' || it.type === 'highlight') {
                    return (
                      <path
                        key={it.id}
                        d={pts2path(it.points)}
                        stroke={it.color}
                        strokeWidth={it.width || 2}
                        strokeOpacity={it.opacity ?? 1}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ cursor: 'move', pointerEvents: 'auto' }}
                        onPointerDown={e => startDrag(e, it.id)}
                      />
                    )
                  }

                  // Shapes
                  if (it.type === 'shape') {
                    const w = it.w || 120
                    const h = it.h || 80
                    if (it.shapeType === 'circle') {
                      return (
                        <g key={it.id} onPointerDown={e => startDrag(e, it.id)} style={{ pointerEvents: 'auto' }}>
                          <ellipse
                            cx={it.x + w / 2} cy={it.y + h / 2}
                            rx={Math.abs(w / 2)} ry={Math.abs(h / 2)}
                            stroke={it.color || color} strokeWidth={2} fill="none"
                            style={{ cursor: 'move', outline: selOutline }}
                          />
                          {isSel && (
                            <rect
                              x={it.x + w - 8} y={it.y + h - 8} width={8} height={8}
                              fill="var(--accent)" style={{ cursor: 'nwse-resize' }}
                              onPointerDown={e => startResize(e, it.id)}
                            />
                          )}
                        </g>
                      )
                    }
                    if (it.shapeType === 'line' || it.shapeType === 'arrow') {
                      return (
                        <g key={it.id} onPointerDown={e => startDrag(e, it.id)} style={{ pointerEvents: 'auto' }}>
                          <line
                            x1={it.x} y1={it.y} x2={it.x + w} y2={it.y + h}
                            stroke={it.color || color} strokeWidth={2}
                            markerEnd={it.shapeType === 'arrow' ? 'url(#arrow)' : undefined}
                            style={{ cursor: 'move' }}
                          />
                          {isSel && (
                            <circle
                              cx={it.x + w} cy={it.y + h} r={5}
                              fill="var(--accent)" style={{ cursor: 'nwse-resize' }}
                              onPointerDown={e => startResize(e, it.id)}
                            />
                          )}
                        </g>
                      )
                    }
                    return (
                      <g key={it.id} onPointerDown={e => startDrag(e, it.id)} style={{ pointerEvents: 'auto' }}>
                        <rect
                          x={it.x} y={it.y} width={Math.abs(w)} height={Math.abs(h)}
                          stroke={it.color || color} strokeWidth={2} fill="none"
                          style={{ cursor: 'move', outline: selOutline }}
                        />
                        {isSel && (
                          <rect
                            x={it.x + w - 8} y={it.y + h - 8} width={8} height={8}
                            fill="var(--accent)" style={{ cursor: 'nwse-resize' }}
                            onPointerDown={e => startResize(e, it.id)}
                          />
                        )}
                      </g>
                    )
                  }

                  // Whiteout
                  if (it.type === 'whiteout') {
                    return (
                      <g key={it.id} onPointerDown={e => startDrag(e, it.id)} style={{ pointerEvents: 'auto' }}>
                        <rect
                          x={it.x} y={it.y} width={it.w || 140} height={it.h || 32}
                          fill="#FFFFFF" stroke={isSel ? 'var(--accent)' : '#CCCCCC'}
                          strokeWidth={isSel ? 1.5 : 1}
                          style={{ cursor: 'move' }}
                        />
                        {isSel && (
                          <rect
                            x={it.x + (it.w || 140) - 8} y={it.y + (it.h || 32) - 8}
                            width={8} height={8} fill="var(--accent)"
                            style={{ cursor: 'nwse-resize' }}
                            onPointerDown={e => startResize(e, it.id)}
                          />
                        )}
                      </g>
                    )
                  }

                  // Erase & Replace Whiteout Box with Editable Text
                  if (it.type === 'whiteout_text') {
                    return (
                      <foreignObject
                        key={it.id}
                        x={it.x} y={it.y}
                        width={Math.max(it.w || 140, 40)}
                        height={Math.max(it.h || 32, 24)}
                        style={{ overflow: 'visible', cursor: 'move', pointerEvents: 'auto' }}
                        onPointerDown={e => startDrag(e, it.id)}
                      >
                        <div
                          style={{
                            width: '100%', height: '100%',
                            background: '#FFFFFF',
                            border: isSel ? '2px dashed var(--accent)' : '1px solid #D1D5DB',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                            borderRadius: 3, display: 'flex', alignItems: 'center', padding: '0 4px',
                          }}
                        >
                          <input
                            autoFocus
                            placeholder="Type replacement text…"
                            value={it.text || ''}
                            onChange={e => {
                              const val = e.target.value
                              setItems(p => p.map(i => i.id === it.id ? { ...i, text: val } : i))
                            }}
                            style={{
                              width: '100%', height: '100%', border: 'none', background: 'transparent',
                              outline: 'none', fontSize: it.fontSize || 14, color: it.color || '#191816',
                              fontFamily: it.fontFamily || fontFamily,
                            }}
                          />
                        </div>
                      </foreignObject>
                    )
                  }

                  // Signature or Image
                  if (it.type === 'sign' || it.type === 'images') {
                    return (
                      <g key={it.id} onPointerDown={e => startDrag(e, it.id)} style={{ pointerEvents: 'auto' }}>
                        <image
                          href={it.dataUrl}
                          x={it.x} y={it.y}
                          width={it.w || 160} height={it.h || 70}
                          preserveAspectRatio="none"
                          style={{ cursor: 'move', outline: isSel ? '2px solid var(--accent)' : 'none' }}
                        />
                        {isSel && (
                          <rect
                            x={it.x + (it.w || 160) - 8} y={it.y + (it.h || 70) - 8}
                            width={8} height={8} fill="var(--accent)"
                            style={{ cursor: 'nwse-resize' }}
                            onPointerDown={e => startResize(e, it.id)}
                          />
                        )}
                      </g>
                    )
                  }

                  // Form Input Box
                  if (it.type === 'form') {
                    return (
                      <foreignObject
                        key={it.id}
                        x={it.x} y={it.y}
                        width={it.w || 180} height={it.h || 30}
                        style={{ cursor: 'move', outline: isSel ? '2px solid var(--accent)' : 'none', pointerEvents: 'auto' }}
                        onPointerDown={e => startDrag(e, it.id)}
                      >
                        <input
                          xmlns="http://www.w3.org/1999/xhtml"
                          value={it.value || ''}
                          placeholder="Form Field…"
                          onChange={e => {
                            const val = e.target.value
                            setItems(p => p.map(i => i.id === it.id ? { ...i, value: val } : i))
                          }}
                          style={{
                            width: '100%', height: '100%',
                            border: '1.5px solid #888', padding: '0 6px',
                            fontSize: 12, background: 'rgba(255,255,255,0.95)',
                            borderRadius: 3, outline: 'none',
                          }}
                        />
                      </foreignObject>
                    )
                  }

                  // Added Text / Stamps
                  return (
                    <foreignObject
                      key={it.id}
                      x={it.x} y={it.y}
                      width={Math.max(it.w || 180, 50)}
                      height={Math.max(it.h || 40, 24)}
                      style={{ overflow: 'visible', cursor: 'move', pointerEvents: 'auto' }}
                      onPointerDown={e => startDrag(e, it.id)}
                    >
                      {it.type === 'text' ? (
                        <div
                          xmlns="http://www.w3.org/1999/xhtml"
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={e => {
                            const textVal = e.currentTarget.innerText
                            setItems(p => p.map(i => i.id === it.id ? { ...i, text: textVal } : i))
                          }}
                          style={{
                            fontFamily: it.fontFamily || fontFamily,
                            fontSize: it.fontSize || 16,
                            color: it.color || '#191816',
                            fontWeight: it.bold ? 700 : 400,
                            fontStyle: it.italic ? 'italic' : 'normal',
                            textDecoration: it.underline ? 'underline' : 'none',
                            outline: isSel ? '1.5px dashed var(--accent)' : 'none',
                            minWidth: 40, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                            background: 'transparent', cursor: 'text', padding: '2px 4px',
                          }}
                        >
                          {it.text}
                        </div>
                      ) : (
                        <div
                          xmlns="http://www.w3.org/1999/xhtml"
                          style={{
                            fontFamily: it.fontFamily || 'inherit',
                            fontSize: it.fontSize || 22,
                            color: it.color || '#191816',
                            opacity: it.opacity ?? 1,
                            fontWeight: it.bold ? 700 : 400,
                            fontStyle: it.italic ? 'italic' : 'normal',
                            outline: isSel ? '1.5px dashed var(--accent)' : 'none',
                            whiteSpace: 'nowrap', background: 'transparent',
                            padding: '2px 4px',
                            transform: it.type === 'watermark' ? 'rotate(-30deg)' : 'none',
                            transformOrigin: 'top left',
                          }}
                        >
                          {it.text}
                        </div>
                      )}
                    </foreignObject>
                  )
                })}

                {/* Live Freehand Preview */}
                {isDrawing && drawPts.length > 1 && (
                  <path
                    d={pts2path(drawPts)}
                    stroke={activeTool === 'highlight' ? '#FFFF00' : drawColor}
                    strokeWidth={drawWidth}
                    strokeOpacity={activeTool === 'highlight' ? 0.38 : 1}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pointerEvents="none"
                  />
                )}

                <defs>
                  <marker id="arrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill={color} />
                  </marker>
                </defs>
              </svg>
            </div>
          )}
        </div>

        {/* ── RIGHT: Properties Panel ── */}
        {selectedItem && (
          <div style={{
            width: 196, background: 'var(--surface)', borderLeft: '1px solid var(--border)',
            padding: 12, overflowY: 'auto', flexShrink: 0,
          }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>
              Properties
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <label style={{ fontSize: 10.5, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>X Position</label>
                <input
                  type="number"
                  value={Math.round(selectedItem.x)}
                  style={fieldStyle}
                  onChange={e => setItems(p => p.map(i => i.id === selectedId ? { ...i, x: +e.target.value } : i))}
                />
              </div>

              <div>
                <label style={{ fontSize: 10.5, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Y Position</label>
                <input
                  type="number"
                  value={Math.round(selectedItem.y)}
                  style={fieldStyle}
                  onChange={e => setItems(p => p.map(i => i.id === selectedId ? { ...i, y: +e.target.value } : i))}
                />
              </div>

              {selectedItem.w != null && (
                <div>
                  <label style={{ fontSize: 10.5, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Width</label>
                  <input
                    type="number"
                    value={Math.round(selectedItem.w)}
                    style={fieldStyle}
                    onChange={e => setItems(p => p.map(i => i.id === selectedId ? { ...i, w: +e.target.value } : i))}
                  />
                </div>
              )}

              {selectedItem.h != null && (
                <div>
                  <label style={{ fontSize: 10.5, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Height</label>
                  <input
                    type="number"
                    value={Math.round(selectedItem.h)}
                    style={fieldStyle}
                    onChange={e => setItems(p => p.map(i => i.id === selectedId ? { ...i, h: +e.target.value } : i))}
                  />
                </div>
              )}

              {selectedItem.type === 'text' && (
                <div>
                  <label style={{ fontSize: 10.5, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Font Size</label>
                  <input
                    type="number"
                    value={selectedItem.fontSize || 16}
                    style={fieldStyle}
                    onChange={e => setItems(p => p.map(i => i.id === selectedId ? { ...i, fontSize: +e.target.value } : i))}
                  />
                </div>
              )}

              {selectedItem.opacity != null && (
                <div>
                  <label style={{ fontSize: 10.5, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                    Opacity ({Math.round((selectedItem.opacity ?? 1) * 100)}%)
                  </label>
                  <input
                    type="range" min={0.05} max={1} step={0.05}
                    value={selectedItem.opacity ?? 1}
                    onChange={e => setItems(p => p.map(i => i.id === selectedId ? { ...i, opacity: +e.target.value } : i))}
                  />
                </div>
              )}

              {selectedItem.color && (
                <div>
                  <label style={{ fontSize: 10.5, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Color</label>
                  <input
                    type="color"
                    value={selectedItem.color}
                    style={{ width: '100%', height: 28, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}
                    onChange={e => setItems(p => p.map(i => i.id === selectedId ? { ...i, color: e.target.value } : i))}
                  />
                </div>
              )}

              <button
                onClick={deleteSelected}
                style={{
                  background: 'var(--danger-bg)', color: 'var(--danger)',
                  border: '1px solid var(--danger)', borderRadius: 6,
                  padding: '7px', fontSize: 12, cursor: 'pointer', marginTop: 4,
                }}
              >
                🗑 Delete Element
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── SIGNATURE MODAL ── */}
      {showSign && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20,
        }}>
          <div style={{
            background: 'var(--surface-elevated, #FFFFFF)', borderRadius: 18,
            padding: 26, width: 480, maxWidth: '95vw',
            boxShadow: '0 20px 60px rgba(0,0,0,.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Create Signature</h3>
              <button
                onClick={() => setShowSign(false)}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {['draw', 'type', 'upload'].map(m => (
                <button
                  key={m}
                  onClick={() => setSignMode(m)}
                  style={{ ...btnStyle(signMode === m), textTransform: 'capitalize', padding: '7px 16px', fontSize: 13 }}
                >
                  {m}
                </button>
              ))}
            </div>

            {signMode === 'draw' && (
              <>
                <div style={{ background: '#F9F8F6', border: '1.5px dashed #CCC', borderRadius: 10, marginBottom: 8, cursor: 'crosshair', overflow: 'hidden' }}>
                  <canvas
                    ref={signCanvasRef}
                    width={440} height={130}
                    style={{ display: 'block', maxWidth: '100%' }}
                    onMouseDown={signStart}
                    onMouseMove={signDraw}
                    onMouseUp={() => setSignDrawing(false)}
                    onMouseLeave={() => setSignDrawing(false)}
                  />
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Draw your signature above with mouse or touch
                </p>
              </>
            )}

            {signMode === 'type' && (
              <>
                <input
                  value={signText}
                  onChange={e => setSignText(e.target.value)}
                  placeholder="Your Name…"
                  style={{ ...fieldStyle, fontSize: 18, fontFamily: signFont, padding: '10px 14px', marginBottom: 8 }}
                />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {['"Dancing Script", cursive', '"Caveat", cursive', '"Playfair Display", serif', 'Georgia, serif'].map(f => (
                    <button
                      key={f}
                      onClick={() => setSignFont(f)}
                      style={{ ...btnStyle(signFont === f), padding: '5px 12px' }}
                    >
                      <span style={{ fontFamily: f, fontSize: 16 }}>Signature</span>
                    </button>
                  ))}
                </div>
                {signText && (
                  <div style={{
                    background: '#F9F8F6', border: '1px solid var(--border)', borderRadius: 10,
                    padding: '12px 18px', marginBottom: 10, fontFamily: signFont,
                    fontSize: 34, color: '#191816', minHeight: 64,
                  }}>
                    {signText}
                  </div>
                )}
              </>
            )}

            {signMode === 'upload' && (
              <>
                <div
                  onClick={() => signUploadRef.current?.click()}
                  style={{
                    background: '#F9F8F6', border: '1.5px dashed #CCC', borderRadius: 10,
                    padding: 24, textAlign: 'center', cursor: 'pointer', marginBottom: 8,
                    minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {signDataUrl ? (
                    <img src={signDataUrl} alt="Signature Preview" style={{ maxHeight: 90, maxWidth: '100%' }} />
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Click to upload signature (PNG or JPG)</span>
                  )}
                </div>
                <input
                  ref={signUploadRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) {
                      const r = new FileReader()
                      r.onload = ev => setSignDataUrl(ev.target.result)
                      r.readAsDataURL(f)
                    }
                  }}
                />
              </>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button onClick={clearSignCanvas} style={btnStyle(false)}>Clear</button>
              <button
                onClick={applySignature}
                style={{
                  background: 'var(--accent)', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '8px 22px', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Insert Signature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden image file input */}
      <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
    </div>
  )
}
