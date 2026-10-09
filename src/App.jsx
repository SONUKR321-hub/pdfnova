import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Toast from './components/layout/Toast'
import Seo from './components/layout/Seo'
import LegalPage from './pages/LegalPage'
import HomeView from './components/home/HomeView'
import { useAppStore } from './store/useAppStore'
import { useEffect, lazy, Suspense } from 'react'

// Tool page lazy imports
const MergeTool       = lazy(()=>import('./pages/tools/MergeTool'))
const CompressTool    = lazy(()=>import('./pages/tools/CompressTool'))
const SplitTool       = lazy(()=>import('./pages/tools/SplitTool'))
const ImageToPdfTool  = lazy(()=>import('./pages/tools/ImageToPdfTool'))
const PdfToImgTool    = lazy(()=>import('./pages/tools/PdfToImgTool'))
const ProtectTool     = lazy(()=>import('./pages/tools/ProtectTool'))
const SignTool        = lazy(()=>import('./pages/tools/SignTool'))
const ExtractTextTool = lazy(()=>import('./pages/tools/ExtractTextTool'))
const EditTool        = lazy(()=>import('./pages/tools/EditTool'))
const RotateTool      = lazy(()=>import('./pages/tools/RotateTool'))
const CompressImgTool = lazy(()=>import('./pages/tools/CompressImgTool'))
const SummarizeTool   = lazy(()=>import('./pages/tools/SummarizeTool'))
const AskTool         = lazy(()=>import('./pages/tools/AskTool'))
const WorkflowTool    = lazy(()=>import('./pages/tools/WorkflowTool'))
const ExtractImgTool  = lazy(()=>import('./pages/tools/ExtractImgTool'))

const Spinner = () => (
  <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh',color:'var(--text-muted)',fontSize:14,gap:10}}>
    <span style={{display:'inline-block',width:18,height:18,border:'2px solid var(--border)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
    Loading…
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
)

export default function App() {
  const { theme } = useAppStore()
  useEffect(()=>{
    document.documentElement.setAttribute('data-theme',theme)
  },[theme])

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <div className="min-h-screen flex flex-col bg-bg text-text transition-colors duration-200">
        <Seo />
        <Header />
        <main className="flex-1 w-full">
          <Suspense fallback={<Spinner />}>
            <Routes>
              <Route path="/"                    element={<HomeView />} />
              <Route path="/tool/merge"          element={<MergeTool />} />
              <Route path="/tool/compress"       element={<CompressTool />} />
              <Route path="/tool/split"          element={<SplitTool />} />
              <Route path="/tool/img-to-pdf"     element={<ImageToPdfTool />} />
              <Route path="/tool/pdf-to-img"     element={<PdfToImgTool />} />
              <Route path="/tool/protect"        element={<ProtectTool />} />
              <Route path="/tool/unlock"         element={<ProtectTool />} />
              <Route path="/tool/sign"           element={<SignTool />} />
              <Route path="/tool/extract-text"   element={<ExtractTextTool />} />
              <Route path="/tool/extract-images" element={<ExtractImgTool />} />
              <Route path="/tool/edit"           element={<EditTool />} />
              <Route path="/tool/rotate"         element={<RotateTool />} />
              <Route path="/tool/compress-img"   element={<CompressImgTool />} />
              <Route path="/tool/summarize"      element={<SummarizeTool />} />
              <Route path="/tool/ask"            element={<AskTool />} />
              <Route path="/tool/workflow"       element={<WorkflowTool />} />
              <Route path="/privacy"              element={<LegalPage type="privacy" />} />
              <Route path="/terms"                element={<LegalPage type="terms" />} />
              <Route path="/documentation"        element={<LegalPage type="docs" />} />
              <Route path="*"                    element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <Toast />
      </div>
    </BrowserRouter>
  )
}
