import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nProvider } from './i18n';
import { SalonProvider } from './context/SalonContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Pages
import { Home } from './pages/Home';
import { JoinQueue } from './pages/JoinQueue';
import { MyStatus } from './pages/MyStatus';
import { Reception } from './pages/Reception';
import { BarberView } from './pages/BarberView';
import { TvDisplay } from './pages/TvDisplay';
import { AdminSettings } from './pages/AdminSettings';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-charcoal-950 text-charcoal-100">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <SalonProvider>
        <BrowserRouter>
          <Routes>
            {/* TV Display has dedicated full-screen layout without standard navbar/footer */}
            <Route path="/display" element={<TvDisplay />} />

            {/* Standard Pages */}
            <Route
              path="/"
              element={
                <AppLayout>
                  <Home />
                </AppLayout>
              }
            />
            <Route
              path="/join"
              element={
                <AppLayout>
                  <JoinQueue />
                </AppLayout>
              }
            />
            <Route
              path="/status/:id"
              element={
                <AppLayout>
                  <MyStatus />
                </AppLayout>
              }
            />
            <Route
              path="/reception"
              element={
                <AppLayout>
                  <Reception />
                </AppLayout>
              }
            />
            <Route
              path="/barber/:name"
              element={
                <AppLayout>
                  <BarberView />
                </AppLayout>
              }
            />
            <Route
              path="/admin"
              element={
                <AppLayout>
                  <AdminSettings />
                </AppLayout>
              }
            />

            {/* Fallback to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SalonProvider>
    </I18nProvider>
  );
};

export default App;
