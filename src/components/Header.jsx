import React from 'react';
import { useApp } from '../context/AppContext';
import SpoletoRadarLogo from './SpoletoRadarLogo';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  FileText, 
  Store, 
  Users, 
  Settings,
  Paperclip
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import RoleSimulatorBar from './RoleSimulatorBar';

export default function Header() {
  const { 
    activeTab, 
    setActiveTab, 
    visibleStores = [], 
    visibleVisits = [], 
    visibleConsultants = [], 
    canAccessSettings,
    hasPermission,
    isRepositoryOpen, 
    setIsRepositoryOpen 
  } = useApp();

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand com o Logo Oficial Spoleto Radar */}
        <div 
          className="brand-wrapper header-brand" 
          onClick={() => setActiveTab('dashboard')} 
          style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', cursor: 'pointer', flexShrink: 0 }}
        >
          <SpoletoRadarLogo />
        </div>

        {/* Navegação Principal */}
        <nav className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={16} /> Dashboard
          </button>

          {hasPermission('new_visit') && (
            <button 
              className={`nav-tab ${activeTab === 'new-visit' ? 'active' : ''}`}
              onClick={() => setActiveTab('new-visit')}
            >
              <ClipboardCheck size={16} /> Visita de Consultoria
            </button>
          )}

          <button 
            className={`nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.45rem',
              textAlign: 'center'
            }}
          >
            <FileText size={16} style={{ flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1.15 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Relatórios</span>
              <span style={{ fontSize: '0.74rem', opacity: 0.9 }}>de Visitas</span>
            </div>
            <span 
              style={{ 
                background: activeTab === 'reports' ? 'var(--primary-brown-light, #F5EFEB)' : 'rgba(255, 255, 255, 0.18)',
                color: activeTab === 'reports' ? 'var(--primary-brown)' : '#FFFFFF',
                border: activeTab === 'reports' ? '1px solid var(--border-subtle)' : '1px solid rgba(255, 255, 255, 0.3)',
                padding: '0.15rem 0.45rem',
                borderRadius: '10px',
                fontSize: '0.72rem',
                fontWeight: 800,
                lineHeight: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: 'center'
              }}
            >
              {visibleVisits.length}
            </span>
          </button>

          <button 
            className={`nav-tab ${activeTab === 'stores' ? 'active' : ''}`}
            onClick={() => setActiveTab('stores')}
          >
            <Store size={16} /> Lojas <span className="tab-count">({visibleStores.length})</span>
          </button>

          <button 
            className={`nav-tab ${activeTab === 'consultants' ? 'active' : ''}`}
            onClick={() => setActiveTab('consultants')}
          >
            <Users size={16} /> Equipe <span className="tab-count">({visibleConsultants.length})</span>
          </button>

          {canAccessSettings && (
            <button 
              className={`nav-tab ${activeTab === 'taxonomy' || activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={16} /> Configurações
            </button>
          )}
        </nav>

        {/* Ações da Direita: Simulador de Perfil ("Ver como..."), Repositório & Notificações - NUNCA ENCOLHEM NEM CORTAM */}
        <div className="header-right-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
          {/* Seletor "Ver como..." */}
          <RoleSimulatorBar />
          {/* Ícone de Clips - Repositório de Documentos */}
          <button
            type="button"
            onClick={() => setIsRepositoryOpen(true)}
            title="Repositório"
            style={{
              position: 'relative',
              background: isRepositoryOpen ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#FFFFFF',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.22)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isRepositoryOpen ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Paperclip size={18} />
          </button>

          {/* Sininho de Notificações */}
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
