import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from '../components/ui/Icon'

const PUBLISHER = 'Sonu Kumar'
const CONTACT = 'rsidharth351@gmail.com'

const CONTENT = {
  privacy: {
    title: 'Privacy Notice',
    intro: `This Privacy Notice explains how ${PUBLISHER}, an independent developer operating PDFNova, handles information when you use the service.`,
    sections: [
      ['Controller and contact', `For privacy questions, access or correction requests, deletion requests, or complaints, contact ${PUBLISHER} at ${CONTACT}.`],
      ['Browser-based processing', 'PDFNova is designed to process supported documents and images locally in your browser. The PDF and image tools do not intentionally upload the file contents selected for processing to a PDFNova server.'],
      ['Information we may receive', 'The hosting provider and infrastructure may process standard technical information needed to deliver the website, such as IP address, device/browser information, timestamps, requested URLs, and security logs. We do not ask for an account, Aadhaar number, government ID number, or payment information.'],
      ['Local storage and cookies', 'PDFNova may store limited preferences, such as your theme, in browser local storage. The application does not intentionally use advertising cookies or sell personal information. Hosting, security, analytics, fonts, or other third-party services may use their own technologies under their own policies.'],
      ['Purpose and retention', 'Technical data is used for hosting, security, abuse prevention, troubleshooting, and service operation, and is retained only as reasonably necessary for those purposes or as required by law. Files downloaded by you are under your control and may remain in your device downloads folder.'],
      ['Children and sensitive data', 'The service is not directed to children. Do not submit highly sensitive personal data unless you are authorized to do so and have assessed the risks. You are responsible for obtaining any required consent before processing another person’s information.'],
      ['India data-protection rights', 'Subject to applicable law, you may contact us to request information about personal data handled through the service, correction, or deletion, and to raise a grievance. We will verify requests where reasonably necessary and respond within the period required by applicable law, including the Digital Personal Data Protection Act, 2023 and applicable rules.'],
      ['Grievance contact', `Privacy and grievance contact: ${PUBLISHER}, ${CONTACT}. If you believe your request has not been handled appropriately, include the relevant details and we will review it.`],
      ['Changes', 'We may update this notice when the service, law, or processing practices change. The “Last updated” date identifies the current version.'],
    ],
  },
  terms: {
    title: 'Terms of Use',
    intro: `These Terms of Use form an agreement between you and ${PUBLISHER}, an independent developer operating PDFNova.`,
    sections: [
      ['Eligibility and acceptance', 'By accessing PDFNova, you agree to these terms and applicable law. If you use the service for an organization, you confirm that you have authority to accept these terms for it.'],
      ['Acceptable use', 'Use PDFNova only with files you own or are authorized to process. Do not use it to infringe copyright, privacy, publicity, or other rights; distribute malware; process unlawful content; bypass security; overload the service; or attempt unauthorized access.'],
      ['Copyright complaints', `If you believe content or a link associated with PDFNova infringes your rights, contact ${CONTACT} with your name, contact details, identification of the work, the relevant URL or description, a statement of good-faith belief, and confirmation that the information is accurate. We may request additional information before taking action.`],
      ['Your content', 'You retain responsibility for your files, instructions, and generated outputs. You confirm that you have the rights and permissions needed to use them. PDFNova does not claim ownership of your content.'],
      ['Free service and no payment refunds', 'PDFNova is currently offered free of charge and does not require a subscription or payment. If paid features are introduced later, separate pricing, billing, cancellation, and refund terms will be provided before payment.'],
      ['Output and accuracy disclaimer', 'Processing may fail or produce results that require review. Outputs may not satisfy a particular government portal, examination board, legal, medical, archival, accessibility, print, or professional requirement. You must inspect and validate every result before relying on it.'],
      ['No professional advice', 'PDFNova is a software utility and does not provide legal, financial, medical, immigration, government, or professional advice.'],
      ['Availability and changes', 'The service is provided on an “as available” and “as is” basis. Features may change, be limited, or be discontinued. We do not promise uninterrupted availability, error-free operation, or compatibility with every file or browser.'],
      ['Limitation of liability', `To the maximum extent permitted by applicable law, ${PUBLISHER} is not liable for indirect, incidental, special, consequential, or loss-of-data damages arising from use of the service. Nothing in these terms excludes liability that cannot lawfully be excluded.`],
      ['Indemnity', 'To the extent permitted by law, you agree to be responsible for claims arising from your unlawful use of the service, your content, or your violation of these terms or another person’s rights.'],
      ['Governing law and disputes', 'These terms are governed by the laws of India. Subject to mandatory consumer or other legal rights, disputes will be subject to the courts having jurisdiction where the service operator is located in India.'],
      ['Contact and changes', `For questions about these terms, contact ${PUBLISHER} at ${CONTACT}. We may update these terms by publishing a revised version with a new update date.`],
    ],
  },
  docs: {
    title: 'Documentation',
    intro: 'Quick instructions for using PDFNova tools.',
    sections: [
      ['PDF tools', 'Choose a tool from All Features, select a file, configure the available options, process it, and download the result. PDF compression supports custom KB or MB targets.'],
      ['Image tools', 'Upload one or more images, choose JPG, PNG, or WebP, set a KB/MB limit, and specify dimensions in pixels, inches, centimeters, or millimeters. DPI converts physical units to pixels.'],
      ['Form presets', 'Use Passport photo, Signature, Form photo, or ID document presets, then adjust the values if a particular portal gives different requirements.'],
      ['Privacy', 'Processing is intended to happen in your browser. Keep the browser tab open until processing and download are complete, and verify the downloaded file before submitting it. Read the Privacy Notice for data-handling details.'],
      ['Support and legal requests', `For support, privacy, copyright, or legal requests, contact ${PUBLISHER} at ${CONTACT}. Do not email confidential document contents unless specifically requested and necessary.`],
    ],
  },
}

export default function LegalPage({ type }) {
  const location = useLocation()
  const content = CONTENT[type]

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-accent mb-8">
        <Icon name="ArrowRight" size={13} className="rotate-180" />
        Back to PDFNova
      </Link>
      <article className="p-6 sm:p-10 rounded-2xl bg-surface border border-border shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-accent text-white flex items-center justify-center">
            <Icon name={type === 'privacy' ? 'Shield' : 'FileText'} size={21} />
          </div>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-text">{content.title}</h1>
            <p className="text-xs text-text-muted">Last updated: October 9, 2026 · Publisher: {PUBLISHER}</p>
          </div>
        </div>
        <p className="text-base text-text-secondary leading-relaxed border-b border-border pb-6 mb-6">{content.intro}</p>
        <div className="space-y-7">
          {content.sections.map(([heading, text]) => (
            <section key={heading}>
              <h2 className="text-lg font-bold text-text mb-2">{heading}</h2>
              <p className="text-sm leading-7 text-text-secondary">{text}</p>
            </section>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-10 pt-5 border-t border-border">
          Current page: {location.pathname}
        </p>
      </article>
    </main>
  )
}
