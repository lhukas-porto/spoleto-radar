import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import SpoletoRadarLogo from './SpoletoRadarLogo';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  FileText, 
  Store, 
  Users, 
  Settings,
  Paperclip,
  LogOut,
  Target,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function Header() {
  const { 
    activeTab, 
    setActiveTab, 
    visibleStores = [], 
    visibleVisits = [], 
    visibleConsultants = [], 
    canAccessSettings,
    isRepositoryOpen, 
    setIsRepositoryOpen,
    currentUser,
    logout,
    activeUser
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Fecha o menu de perfil ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayUser = currentUser || activeUser || {
    name: 'LILIANE TAHAN CURY TEIXEIRA DE RESENDE',
    shortName: 'Liliane Cury',
    email: 'liliane.cury@spoleto.com.br',
    role: 'GERENTE_NACIONAL',
    region: 'Nacional / Brasil'
  };

  const getInitials = (name) => {
    if (!name) return 'LC';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

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

        {/* Menu de Navegação Superior */}
        <nav className="nav-tabs header-nav" style={{ display: 'flex', alignItems: 'center' }}>
          <button 
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={16} /> Painel Geral
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
            <FileText size={16} /> Relatórios 
            <span 
              className="count-pill" 
              style={{
                marginLeft: '0.35rem', 
                backgroundColor: 'rgba(255, 255, 255, 0.25)', 
                color: '#FFFFFF', 
                padding: '0.1rem 0.45rem', 
                borderRadius: '10px', 
                fontSize: '0.72rem', 
                fontWeight: 700
              }}
            >
              {visibleVisits.length}
            </span>
          </button>

          <button 
            className={`nav-tab ${activeTab === 'stores' ? 'active' : ''}`}
            onClick={() => setActiveTab('stores')}
          >
            <Store size={16} /> Lojas <span className="count-pill">{visibleStores.length}</span>
          </button>

          <button 
            className={`nav-tab ${activeTab === 'consultants' ? 'active' : ''}`}
            onClick={() => setActiveTab('consultants')}
          >
            <Users size={16} /> Equipe <span className="count-pill">{visibleConsultants.length}</span>
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

        {/* Ações da Direita: Crachá Oficial do Usuário Logado, Repositório & Notificações */}
        <div className="header-right-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
          {/* Crachá Corporativo com Dropdown de Logout */}
          <div style={{ position: 'relative' }} ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                background: isUserMenuOpen ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.28)',
                color: '#FFFFFF',
                padding: '0.3rem 0.7rem 0.3rem 0.4rem',
                borderRadius: '24px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                backdropFilter: 'blur(6px)'
              }}
              title="Clique para ver detalhes do seu perfil ou sair"
            >
              {/* Avatar com Iniciais */}
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F1A80A 0%, #D97706 100%)',
                color: '#2B1810',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.75rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                {getInitials(displayUser.shortName || displayUser.name)}
              </div>

              {/* Nome e Badge */}
              <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                  {displayUser.shortName || 'Liliane Cury'}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#FDE68A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <span>🎯 Gerência Nacional</span>
                </div>
              </div>

              <ChevronDown 
                size={13} 
                style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  transform: isUserMenuOpen ? 'rotate(180deg)' : 'none', 
                  transition: 'transform 0.15s ease' 
                }} 
              />
            </button>

            {/* Menu Suspenso */}
            {isUserMenuOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '280px',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.1)',
                zIndex: 1000,
                padding: '0.75rem',
                animation: 'fadeIn 0.15s ease'
              }}>
                <div style={{ padding: '0.5rem', borderBottom: '1px solid #F1F5F9', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #F1A80A 0%, #D97706 100%)',
                      color: '#2B1810',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.88rem'
                    }}>
                      {getInitials(displayUser.name)}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {displayUser.name || 'Liliane Cury'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {displayUser.email || 'liliane.cury@spoleto.com.br'}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    color: '#92400E',
                    fontWeight: 700,
                    marginTop: '0.25rem'
                  }}>
                    <Target size={11} color="#D97706" />
                    <span>Gerência Nacional • Rede Brasil</span>
                  </div>
                </div>

                <div style={{
                  padding: '0.5rem',
                  fontSize: '0.72rem',
                  color: '#475569',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '6px',
                  marginBottom: '0.5rem',
                  lineHeight: 1.35
                }}>
                  🔐 Sessão autenticada via <strong>Supabase Auth</strong>. Escopo de visualização: todas as lojas e regionais.
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '8px',
                    color: '#B91C1C',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                >
                  <LogOut size={15} />
                  <span>Sair da Conta (Logout)</span>
                </button>
              </div>
            )}
          </div>

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
