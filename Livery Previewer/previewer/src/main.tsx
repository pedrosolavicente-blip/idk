import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './app/App.tsx'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/previewer" element={<App />} />
        <Route path="*"          element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
