import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LaundryProvider } from './context/LaundryContext';
import { PublicLayout } from './components/PublicLayout';
import { PosLayout } from './components/PosLayout';
import { ToastContainer } from './components/ToastContainer';
import { LandingPage } from './pages/LandingPage';
import { ServicesPage } from './pages/ServicesPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { BookingPage } from './pages/BookingPage';
import { TrackingPage } from './pages/TrackingPage';
import { CustomerPortalPage } from './pages/CustomerPortalPage';
import { PosPage } from './pages/PosPage';
import { AdminPage } from './pages/AdminPage';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
};

export default function App() {
  return (
    <LaundryProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* 1. Website Publik Pelanggan (strictly separated) */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/layanan" element={<ServicesPage />} />
            <Route path="/kalkulator" element={<CalculatorPage />} />
            <Route path="/pesan" element={<BookingPage />} />
            <Route path="/lacak" element={<TrackingPage />} />
            <Route path="/akun" element={<CustomerPortalPage />} />
          </Route>

          {/* 2. Panel Kasir & Staff Produksi (strictly separated workspace) */}
          <Route element={<PosLayout />}>
            <Route path="/pos" element={<PosPage />} />
          </Route>

          {/* 3. Dashboard Admin / Pemilik Usaha (strictly separated sidebar SaaS shell) */}
          <Route path="/admin" element={<AdminPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </LaundryProvider>
  );
}
