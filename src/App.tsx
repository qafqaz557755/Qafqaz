/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import AllProductsPage from './pages/AllProductsPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminPanel from './pages/AdminPanel';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage';
import TawkChat from './components/TawkChat';

function AppLayout() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/panel');

  return (
    <div className="min-h-screen flex flex-col selection:bg-brand-blue/30 selection:text-brand-blue font-sans">
      {!isAdminPage && <Navbar />}
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/products" element={<AllProductsPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/panel" element={<AdminPanel />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>

        {!isAdminPage && <TawkChat />}
      </main>

      {!isAdminPage && (
        <footer className="bg-white border-t border-black/5 px-6 py-12">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-sm text-charcoal/60">
            <div className="flex flex-col gap-6">
              <span className="text-2xl font-bold text-charcoal tracking-tight">PURELY</span>
              <p>
                Premium gigiyena və birdəfəlik məhsullar ilə həyatınızı asanlaşdırın.
              </p>
            </div>
            
            <div className="flex flex-col gap-4">
              <span className="font-bold text-charcoal uppercase tracking-widest text-[10px]">Məhsullar</span>
              <a href="#" className="hover:text-brand-blue transition-colors">Təmizlik Vasitələri</a>
              <a href="#" className="hover:text-brand-blue transition-colors">Kağız Məhsulları</a>
              <a href="#" className="hover:text-brand-blue transition-colors">Birdəfəlik Qablar</a>
            </div>
            
            <div className="flex flex-col gap-4">
              <span className="font-bold text-charcoal uppercase tracking-widest text-[10px]">Şirkət</span>
              <a href="#" className="hover:text-brand-blue transition-colors">Haqqımızda</a>
              <a href="#" className="hover:text-brand-blue transition-colors">Vakansiyalar</a>
              <a href="#" className="hover:text-brand-blue transition-colors">Bloq</a>
            </div>
            
            <div className="flex flex-col gap-4">
              <span className="font-bold text-charcoal uppercase tracking-widest text-[10px]">Dəstək</span>
              <a href="#" className="hover:text-brand-blue transition-colors">Yardım Mərkəzi</a>
              <a href="#" className="hover:text-brand-blue transition-colors">Qaydalar</a>
              <a href="#" className="hover:text-brand-blue transition-colors">Geri qaytarma</a>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto mt-12 pt-12 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] uppercase tracking-widest font-bold text-charcoal/30">
            <span>© 2024 PURELY. Bütün hüquqlar qorunur.</span>
            <div className="flex gap-8">
              <a href="#">Instagram</a>
              <a href="#">LinkedIn</a>
              <a href="#">Twitter</a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

