import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './app/App.tsx'
import LandingPage from './app/components/LandingPage.tsx'
import Shop from './app/components/Shop.tsx'
import AdminPanel from './app/components/AdminPanel.tsx'
import ProductDetail from './app/components/ProductDetail.tsx'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<LandingPage />} />
        <Route path="/previewer" element={<App />} />
        <Route path="/shop"      element={<Shop />} />
        <Route path="/shop/:id"  element={<ProductDetail />} />
        <Route path="/admin"      element={<AdminPanel />} />
        <Route path="*"          element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)