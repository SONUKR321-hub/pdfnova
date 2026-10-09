export const ALL_TOOLS = [
  // Convert
  { id: 'pdf-to-word',    intent: 'Convert',    icon: 'FileText',    name: 'PDF → Word',       desc: 'Turn PDFs into fully editable Word documents.',      badge: 'Popular', route: '/tool/pdf-to-word',    color: '#4F7FBA' },
  { id: 'pdf-to-excel',   intent: 'Convert',    icon: 'Table',       name: 'PDF → Excel',      desc: 'Extract tables into clean, editable spreadsheets.',  badge: null,     route: '/tool/pdf-to-excel',   color: '#4F7FBA' },
  { id: 'pdf-to-ppt',     intent: 'Convert',    icon: 'Monitor',     name: 'PDF → PowerPoint', desc: 'Rebuild presentations from PDF slides.',             badge: null,     route: '/tool/pdf-to-ppt',     color: '#4F7FBA' },
  { id: 'img-to-pdf',     intent: 'Convert',    icon: 'Image',       name: 'Image → PDF',      desc: 'Combine JPG, PNG or TIFF files into one PDF.',       badge: null,     route: '/tool/img-to-pdf',     color: '#4F7FBA' },
  { id: 'pdf-to-img',     intent: 'Convert',    icon: 'Image',       name: 'PDF → Images',     desc: 'Export each PDF page as a high-quality image.',      badge: null,     route: '/tool/pdf-to-img',     color: '#4F7FBA' },
  // Compress
  { id: 'compress-pdf',   intent: 'Compress',   icon: 'Minimize2',   name: 'Compress PDF',     desc: 'Shrink large PDFs without visible quality loss.',    badge: 'Popular', route: '/tool/compress',       color: '#B58A4A' },
  { id: 'compress-img',   intent: 'Compress',   icon: 'Minimize2',   name: 'Compress Image',   desc: 'Reduce image size while preserving sharpness.',      badge: null,     route: '/tool/compress-img',   color: '#B58A4A' },
  // Edit
  { id: 'edit-pdf',       intent: 'Edit',       icon: 'Edit3',       name: 'Edit PDF',         desc: 'Annotate, redact, sign and add text to your PDF.',   badge: 'Free',   route: '/tool/edit',           color: '#657A82' },
  { id: 'rotate-pages',   intent: 'Edit',       icon: 'RotateCw',    name: 'Rotate & Reorder', desc: 'Fix orientation and rearrange pages effortlessly.',   badge: null,     route: '/tool/rotate',         color: '#657A82' },
  // Combine
  { id: 'merge-pdf',      intent: 'Combine',    icon: 'GitMerge',    name: 'Merge PDFs',       desc: 'Combine multiple documents into one PDF.',           badge: 'Popular', route: '/tool/merge',          color: '#6F8F7A' },
  // Extract
  { id: 'split-pdf',      intent: 'Extract',    icon: 'Scissors',    name: 'Split PDF',        desc: 'Extract pages or split into separate chapters.',     badge: null,     route: '/tool/split',          color: '#9B7FA8' },
  { id: 'extract-images', intent: 'Extract',    icon: 'Download',    name: 'Extract Images',   desc: 'Pull all embedded images from a PDF instantly.',     badge: null,     route: '/tool/extract-images', color: '#9B7FA8' },
  { id: 'extract-text',   intent: 'Extract',    icon: 'AlignLeft',   name: 'Extract Text',     desc: 'Get all text content from your PDF as plain text.',  badge: null,     route: '/tool/extract-text',   color: '#9B7FA8' },
  // Protect
  { id: 'protect-pdf',    intent: 'Protect',    icon: 'Lock',        name: 'Password Protect', desc: 'Add encryption to keep sensitive documents safe.',   badge: null,     route: '/tool/protect',        color: '#B65C52' },
  { id: 'unlock-pdf',     intent: 'Protect',    icon: 'Unlock',      name: 'Remove Password',  desc: 'Unlock a PDF you have permission to open.',          badge: null,     route: '/tool/unlock',         color: '#B65C52' },
  // Sign
  { id: 'sign-pdf',       intent: 'Sign',       icon: 'PenTool',     name: 'Sign Document',    desc: 'Add a handwritten or typed signature in seconds.',   badge: null,     route: '/tool/sign',           color: '#4A8BA8' },
  // Understand
  { id: 'summarize',      intent: 'Understand', icon: 'Zap',         name: 'Summarize',        desc: 'Get a concise AI summary of any document.',          badge: 'AI',     route: '/tool/summarize',      color: '#B58A4A' },
  { id: 'ask-questions',  intent: 'Understand', icon: 'MessageSquare', name: 'Ask Questions', desc: 'Chat with your document to find anything fast.',     badge: 'AI',     route: '/tool/ask',            color: '#B58A4A' },
  // Automate
  { id: 'workflow',       intent: 'Automate',   icon: 'GitBranch',   name: 'Build Workflow',   desc: 'Chain tools into a repeatable automation pipeline.', badge: 'New',    route: '/tool/workflow',       color: '#6F8F7A' },
]

export const INTENTS = ['All', 'Convert', 'Compress', 'Edit', 'Combine', 'Extract', 'Protect', 'Sign', 'Understand', 'Automate']

export const INTENT_ICONS = {
  All: 'LayoutGrid',
  Convert: 'RefreshCw',
  Compress: 'Minimize2',
  Edit: 'Edit3',
  Combine: 'GitMerge',
  Extract: 'Scissors',
  Protect: 'Lock',
  Sign: 'PenTool',
  Understand: 'Brain',
  Automate: 'GitBranch',
}

export const TRUST_ITEMS = [
  { icon: 'EyeOff',  label: 'No Sign-Up Required', sub: 'Instant access, no account' },
  { icon: 'Zap',     label: '100% Free & Unlimited', sub: 'No daily limits or paywalls' },
  { icon: 'Tag',     label: 'Zero Watermarks', sub: 'Clean, professional outputs' },
  { icon: 'Shield',  label: '100% Client-Side Privacy', sub: 'Files never leave your device' },
]

export const ACCEPT_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.tiff,.bmp,.webp'

export const MAX_FILE_SIZE_MB = 50
