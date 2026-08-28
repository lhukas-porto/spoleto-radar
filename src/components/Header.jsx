import React from 'react';
import { useApp } from '../context/AppContext';
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
        {/* Brand */}
        <div className="brand-wrapper" onClick={() => setActiveTab('dashboard')}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-gold)',
            color: 'var(--primary-brown)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            fontWeight: 900,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            🍝
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="brand-title">Spoleto Radar</span>
              <span className="brand-badge">OFICIAL</span>
            </div>
            <div className="brand-subtitle">
              Consultoria de Negócios &bull; Grupo Trigo ({stores.length} Lojas)
            </div>
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
