import React from 'react';
import { useApp } from '../context/AppContext';
import SpoletoRadarLogo from './SpoletoRadarLogo';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  FileText, 
  Store, 
  Users, 
  Settings2,
  RefreshCw,
  Radio
} from 'lucide-react';

export default function Header() {
  const { activeTab, setActiveTab, resetToDemoData, stores, visits } = useApp();

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand com o Logo Oficial Spoleto Radar */}
        <div 
          className="brand-wrapper" 
          onClick={() => setActiveTab('dashboard')} 
          style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', cursor: 'pointer' }}
          title="Ir para o Painel Executivo"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <SpoletoRadarLogo variant="navbar" size="md" />
            <span className="brand-badge" style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}>
              CONSULTORIA
            </span>
          </div>
          <div className="brand-subtitle" style={{ fontSize: '0.74rem', opacity: 0.85, paddingLeft: '2px' }}>
            Grupo Trigo &bull; {stores.length} Lojas Ativas
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={16} /> Painel Executivo
          </button>

          <button 
            className={`nav-tab ${activeTab === 'new-visit' ? 'active' : ''}`}
            onClick={() => setActiveTab('new-visit')}
          >
            <ClipboardCheck size={16} /> Nova Visita
          </button>

          <button 
            className={`nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <FileText size={16} /> Relatórios & Visitas ({visits.length})
          </button>

          <button 
            className={`nav-tab ${activeTab === 'stores' ? 'active' : ''}`}
            onClick={() => setActiveTab('stores')}
          >
            <Store size={16} /> Rede de Lojas ({stores.length})
          </button>

          <button 
            className={`nav-tab ${activeTab === 'consultants' ? 'active' : ''}`}
            onClick={() => setActiveTab('consultants')}
          >
            <Users size={16} /> Consultores
          </button>

          <button 
            className={`nav-tab ${activeTab === 'taxonomy' ? 'active' : ''}`}
            onClick={() => setActiveTab('taxonomy')}
          >
            <Settings2 size={16} /> Matriz de Temas
          </button>
        </nav>

        {/* Quick Reset Button */}
        <div>
          <button 
            className="btn-secondary" 
            onClick={resetToDemoData}
            style={{ 
              fontSize: '0.75rem', 
              padding: '0.4rem 0.65rem',
              background: 'rgba(255, 255, 255, 0.12)',
              borderColor: 'rgba(255, 255, 255, 0.25)',
              color: '#FFFFFF'
            }}
            title="Restaurar dados padrão de demonstração"
          >
            <RefreshCw size={13} /> Resetar Demonstração
          </button>
        </div>
      </div>
    </header>
  );
}
