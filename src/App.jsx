import React, { useEffect } from 'react';
import { useApp } from './context/AppContext';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import NewVisitForm from './components/NewVisitForm';
import ReportsView from './components/ReportsView';
import StoresView from './components/StoresView';
import ConsultantsView from './components/ConsultantsView';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import VisitReportModal from './components/VisitReportModal';
import StaffProfileModal from './components/StaffProfileModal';
import OverdueActionsModal from './components/OverdueActionsModal';
import SubordinatesModal from './components/SubordinatesModal';
import StoreProfileModal from './components/StoreProfileModal';
import RepositoryModal from './components/RepositoryModal';
import FranchiseeProfileModal from './components/FranchiseeProfileModal';
import Footer from './components/Footer';
import SpoletoRadarLogo from './components/SpoletoRadarLogo';

export default function App() {
  const context = useApp();
  
  if (!context) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#24140E',
        color: '#FFFFFF',
        fontFamily: 'Inter, sans-serif',
        gap: '1rem'
      }}>
        <SpoletoRadarLogo variant="navbar" size="lg" />
        <div style={{ fontSize: '0.9rem', color: '#F1A80A' }}>Carregando Spoleto Radar...</div>
      </div>
    );
  }

  const { 
    activeTab, 
    visits, 
    setSelectedVisitForReport, 
    selectedStoreForProfile, 
    setSelectedStoreForProfile, 
    toastMessage,
    isRepositoryOpen,
    setIsRepositoryOpen,
    currentUser,
    isAuthLoading,
    loginWithSession
  } = context;

  // Check URL parameters on mount to open shared web report automatically
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const reportId = urlParams.get('report');
      const hash = window.location.hash;

      if (hash && hash.startsWith('#v=')) {
        const jsonStr = decodeURIComponent(hash.replace('#v=', ''));
        const directVisit = JSON.parse(jsonStr);
        if (directVisit) {
          setSelectedVisitForReport(directVisit);
          return;
        }
      }

      if (reportId && visits && visits.length > 0) {
        const found = visits.find(v => v.id === reportId);
        if (found) {
          setSelectedVisitForReport(found);
        }
      }
    } catch (err) {
      console.error('Error parsing shared report URL:', err);
    }
  }, [visits, setSelectedVisitForReport]);

  // Enquanto verifica sessão inicial do Supabase
  if (isAuthLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#24140E',
        color: '#FFFFFF',
        fontFamily: 'Inter, sans-serif',
        gap: '1.25rem'
      }}>
        <SpoletoRadarLogo variant="navbar" size="lg" />
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.6rem', 
          fontSize: '0.88rem', 
          color: 'rgba(255, 255, 255, 0.8)' 
        }}>
          <div style={{
            width: '18px',
            height: '18px',
            border: '2px solid rgba(241, 168, 10, 0.3)',
            borderTopColor: '#F1A80A',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <span>Verificando credenciais corporativas no Supabase...</span>
        </div>
      </div>
    );
  }

  // Se o usuário não estiver autenticado, exibe a tela de login
  if (!currentUser) {
    return (
      <>
        <LoginView onLoginSuccess={loginWithSession} />
        {toastMessage && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--text-main)',
            color: '#FFFFFF',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 9999,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            borderLeft: '4px solid var(--primary-red)'
          }}>
            <span>{typeof toastMessage === 'string' ? toastMessage : toastMessage?.msg || JSON.stringify(toastMessage)}</span>
          </div>
        )}
      </>
    );
  }

  // Usuário autenticado (Liliane Cury - Gerência Nacional)
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      
      <main className="container" style={{ flex: 1, paddingBottom: '3rem' }}>
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'new-visit' && <NewVisitForm />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'stores' && <StoresView />}
        {activeTab === 'consultants' && <ConsultantsView />}
        {(activeTab === 'taxonomy' || activeTab === 'settings') && <SettingsView defaultSubTab={activeTab === 'taxonomy' ? 'taxonomy' : 'taxonomy'} />}
      </main>
      
      <Footer />

      {/* Global Modals */}
      <VisitReportModal />
      <StaffProfileModal />
      <StoreProfileModal store={selectedStoreForProfile} onClose={() => setSelectedStoreForProfile(null)} />
      <FranchiseeProfileModal />
      <OverdueActionsModal />
      <SubordinatesModal />
      <RepositoryModal isOpen={isRepositoryOpen} onClose={() => setIsRepositoryOpen(false)} />

      {/* Global Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'var(--text-main)',
          color: '#FFFFFF',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 9999,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          borderLeft: '4px solid var(--primary-red)'
        }}>
          <span>{typeof toastMessage === 'string' ? toastMessage : toastMessage?.msg || JSON.stringify(toastMessage)}</span>
        </div>
      )}
    </div>
  );
}
