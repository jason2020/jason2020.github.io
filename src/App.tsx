import { Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Footer } from '@/components/Footer'
import { Nav } from '@/components/Nav'
import { Gallery } from '@/routes/Gallery'
import { ProjectDetail } from '@/routes/ProjectDetail'

export default function App() {
  return (
    <div className="app-shell">
      <Nav />
      <main>
        <Suspense fallback={<div className="route-loading">tending the garden…</div>}>
          <Routes>
            <Route path="/" element={<Gallery />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
