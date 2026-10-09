import React from 'react'

export default function WorkflowTool() {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>⚙️</div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Build Workflow</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, maxWidth: 400, margin: '0 auto 24px' }}>
        Chain tools into a repeatable automation pipeline. Chain Compress → Merge → Protect in one click. <strong>Coming soon.</strong>
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, maxWidth: 420, margin: '0 auto', opacity: 0.5 }}>
        {['Upload', '→', 'Compress', '→', 'Merge', '→', 'Protect', '→', '⬇ Download'].map((s,i)=>(
          <div key={i} style={{ padding: '10px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text)' }}>{s}</div>
        ))}
      </div>
    </div>
  )
}
