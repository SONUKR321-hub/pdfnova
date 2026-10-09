import React from 'react'
import Icon from '../ui/Icon'

const APP_BASE = import.meta.env.BASE_URL

export default function Footer() {
  return (
    <footer className="border-t border-border bg-bg-alt/50 mt-auto py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white shadow-sm">
              <Icon name="FileText" size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-xl font-bold text-text">PDFNova</span>
                <span className="text-[10px] font-semibold bg-success/15 text-success border border-success/25 px-1.5 py-0.5 rounded">100% Free</span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                The modern in-browser PDF suite. No sign-up, zero watermarks, unlimited processing.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5 font-medium">
              <Icon name="Shield" size={14} className="text-accent" />
              100% In-Browser Privacy
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Icon name="EyeOff" size={14} className="text-accent" />
              No Account Required
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Icon name="Zap" size={14} className="text-accent" />
              Unlimited Free Usage
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Icon name="Tag" size={14} className="text-accent" />
              Zero Watermarks
            </span>
          </div>
        </div>

        {/* SEO Quick Tool Links */}
        <div className="mt-8 pt-6 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="font-semibold text-text mb-2">Merge & Split</div>
            <ul className="space-y-1 text-text-muted">
              <li><a href={`${APP_BASE}tool/merge`} className="hover:text-accent">Merge PDF Online</a></li>
              <li><a href={`${APP_BASE}tool/split`} className="hover:text-accent">Split PDF Pages</a></li>
              <li><a href={`${APP_BASE}tool/rotate`} className="hover:text-accent">Rotate & Reorder</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-text mb-2">Edit & Sign</div>
            <ul className="space-y-1 text-text-muted">
              <li><a href={`${APP_BASE}tool/edit`} className="hover:text-accent">Edit PDF Text Online</a></li>
              <li><a href={`${APP_BASE}tool/sign`} className="hover:text-accent">Sign PDF Document</a></li>
              <li><a href={`${APP_BASE}tool/whiteout`} className="hover:text-accent">Erase & Whiteout Text</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-text mb-2">Compress & Size</div>
            <ul className="space-y-1 text-text-muted">
              <li><a href={`${APP_BASE}tool/compress`} className="hover:text-accent">Compress PDF to KB/MB</a></li>
              <li><a href={`${APP_BASE}tool/compress-img`} className="hover:text-accent">Compress Images</a></li>
              <li><a href={`${APP_BASE}tool/extract-images`} className="hover:text-accent">Extract High-Res Images</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-text mb-2">Security & Convert</div>
            <ul className="space-y-1 text-text-muted">
              <li><a href={`${APP_BASE}tool/protect`} className="hover:text-accent">Password Protect PDF</a></li>
              <li><a href={`${APP_BASE}tool/unlock`} className="hover:text-accent">Unlock PDF Password</a></li>
              <li><a href={`${APP_BASE}tool/img-to-pdf`} className="hover:text-accent">JPG/PNG to PDF</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <p>© {new Date().getFullYear()} PDFNova. Free &amp; Unlimited Document Suite. All rights reserved.</p>
          <div className="flex gap-4">
            <a href={`${APP_BASE}privacy`} className="hover:text-text transition-colors">Privacy Notice</a>
            <a href={`${APP_BASE}terms`} className="hover:text-text transition-colors">Terms</a>
            <a href={`${APP_BASE}documentation`} className="hover:text-text transition-colors">Documentation</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
