import React from 'react'
import { Link } from 'react-router-dom'

export default function SummarizeTool() {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>🤖</div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>AI Summarizer</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
        Get a concise AI summary of any document. This feature requires an AI API key. For now, use the Extract Text tool to copy your content into an AI assistant.
      </p>
      <Link to="/tool/extract-text" style={{ display: 'inline-block', background: 'var(--accent)', color: '#fff', padding: '11px 28px', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
        Extract Text Instead
      </Link>
    </div>
  )
}
