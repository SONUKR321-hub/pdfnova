import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SITE_URL = 'https://sonukr321-hub.github.io/pdfnova'

const PAGE_SEO = {
  '/': {
    title: 'Free Online PDF Tools - Edit, Merge, Compress & Sign | PDFNova',
    description: 'Use free online PDF tools to edit, merge, split, compress, sign and convert documents. No sign-up, no watermarks, and files stay in your browser.',
    type: 'WebApplication',
  },
  '/tool/compress': {
    title: 'Compress PDF to Any KB or MB Online Free | PDFNova',
    description: 'Compress a PDF to a custom target size in KB or MB. Free browser-based PDF compression with quality presets and no upload or sign-up.',
    type: 'WebApplication',
  },
  '/tool/compress-img': {
    title: 'Resize & Compress Images to KB, MB, px, cm or mm | PDFNova',
    description: 'Resize and compress images for online forms. Set KB or MB limits, pixel or physical dimensions, DPI, JPG, PNG or WebP output, and download privately.',
    type: 'WebApplication',
  },
  '/tool/merge': {
    title: 'Merge PDF Files Online Free - Combine PDFs | PDFNova',
    description: 'Combine multiple PDF files into one document online for free. No sign-up, no watermark, and local browser processing.',
    type: 'WebApplication',
  },
  '/tool/edit': {
    title: 'Edit PDF Text Online Free | PDFNova',
    description: 'Edit, replace, annotate and whiteout PDF text in your browser. Free online PDF editor with no sign-up or watermark.',
    type: 'WebApplication',
  },
  '/tool/split': {
    title: 'Split PDF Pages Online Free | PDFNova',
    description: 'Split PDF files and extract selected pages into new documents with this free browser-based PDF tool.',
    type: 'WebApplication',
  },
  '/privacy': {
    title: 'Privacy Notice | PDFNova',
    description: 'Read the PDFNova privacy notice covering browser-based file processing, local preferences, and third-party resources.',
    type: 'WebPage',
  },
  '/terms': {
    title: 'Terms of Use | PDFNova',
    description: 'Read the PDFNova terms of use for the free online PDF and image tools.',
    type: 'WebPage',
  },
  '/documentation': {
    title: 'PDFNova Documentation - PDF and Image Tools',
    description: 'Learn how to use PDFNova PDF compression, image resizing, form presets, dimensions, DPI, and browser-based processing.',
    type: 'TechArticle',
  },
}

function setMeta(attribute, value, content) {
  let element = document.head.querySelector(`meta[${attribute}="${value}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, value)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

export default function Seo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const seo = PAGE_SEO[pathname] || {
      title: 'Free PDF Tools Online | PDFNova',
      description: 'Free online PDF and image tools for editing, converting, compressing, signing and organizing documents privately in your browser.',
      type: 'WebApplication',
    }
    const canonicalUrl = `${SITE_URL}${pathname === '/' ? '/' : pathname}`

    document.title = seo.title
    setMeta('name', 'description', seo.description)
    setMeta('property', 'og:title', seo.title)
    setMeta('property', 'og:description', seo.description)
    setMeta('property', 'og:url', canonicalUrl)
    setMeta('property', 'og:site_name', 'PDFNova')
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'twitter:title', seo.title)
    setMeta('property', 'twitter:description', seo.description)
    setMeta('property', 'twitter:url', canonicalUrl)
    setMeta('name', 'twitter:card', 'summary_large_image')

    let canonical = document.head.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = canonicalUrl

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': seo.type,
          name: seo.title,
          url: canonicalUrl,
          description: seo.description,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'All',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          publisher: { '@type': 'Organization', name: 'PDFNova', url: SITE_URL },
        },
        ...(pathname === '/'
          ? [{
              '@type': 'FAQPage',
              mainEntity: [
                ['Is PDFNova free?', 'Yes. PDFNova provides free online PDF and image tools with no sign-up and no watermarks.'],
                ['Are my files uploaded?', 'No. PDFNova processes supported files locally in your browser, so files stay on your device.'],
                ['Can I compress a PDF to a specific size?', 'Yes. The PDF compressor supports custom target sizes in KB or MB.'],
                ['Can I resize an image for an online form?', 'Yes. You can set image dimensions in pixels, inches, centimeters, or millimeters, with a DPI setting for physical units.'],
              ].map(([question, answer]) => ({
                '@type': 'Question',
                name: question,
                acceptedAnswer: { '@type': 'Answer', text: answer },
              })),
            }]
          : []),
      ],
    }
    let script = document.getElementById('route-structured-data')
    if (!script) {
      script = document.createElement('script')
      script.id = 'route-structured-data'
      script.type = 'application/ld+json'
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(structuredData)
  }, [pathname])

  return null
}
