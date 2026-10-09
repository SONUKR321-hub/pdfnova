import React from 'react'
import { Link } from 'react-router-dom'

export default function AskTool() {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>💬</div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Ask Your Document</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 32, maxWidth: 420, margin: '0 auto 32px' }}>
        Chat with your document to find answers fast. This feature requires an AI integration. For now, extract the text and paste it into your favourite AI chat.
      </p>
      <Link to="/tool/extract-text" style={{ display: 'inline-block', background: 'var(--accent)', color: '#fff', padding: '11px 28px', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
        Extract Text
      </Link>
    </div>
  )
}
