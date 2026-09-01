import React, { useEffect } from 'react';
import { useApp } from './context/AppContext';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import NewVisitForm from './components/NewVisitForm';
import ReportsView from './components/ReportsView';
import StoresView from './components/StoresView';
import ConsultantsView from './components/ConsultantsView';
import TaxonomyView from './components/TaxonomyView';
import VisitReportModal from './components/VisitReportModal';
import StaffProfileModal from './components/StaffProfileModal';
import OverdueActionsModal from './components/OverdueActionsModal';
import SubordinatesModal from './components/SubordinatesModal';
import StoreProfileModal from './components/StoreProfileModal';
import Footer from './components/Footer';

export default function App() {
  const context = useApp();
  
  if (!context) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando Spoleto Radar...</div>;
  }

  const { 
    activeTab, 
    visits, 
    setSelectedVisitForReport, 
    selectedStoreForProfile, 
    setSelectedStoreForProfile, 
    toastMessage 
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      
      <main className="container" style={{ flex: 1, paddingBottom: '3rem' }}>
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'new-visit' && <NewVisitForm />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'stores' && <StoresView />}
        {activeTab === 'consultants' && <ConsultantsView />}
        {activeTab === 'taxonomy' && <TaxonomyView />}
      </main>
      
      <Footer />

      {/* Global Modals */}
      <VisitReportModal />
      <StaffProfileModal />
      <StoreProfileModal store={selectedStoreForProfile} onClose={() => setSelectedStoreForProfile(null)} />
      <OverdueActionsModal />
      <SubordinatesModal />

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
