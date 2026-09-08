import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  Crown, 
  Award, 
  Target, 
  MapPin, 
  Briefcase, 
  ChevronDown, 
  Check, 
  User,
  Users,
  Eye
} from 'lucide-react';

export default function RoleSimulatorBar() {
  const { 
    simulatedRole, 
    simulatedUserId, 
    changeSimulatedProfile, 
    activeUser, 
    consultants = [] 
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const regionalManagers = consultants.filter(c => c.role === 'GERENTE_REGIONAL');
  const businessConsultants = consultants.filter(c => (c.role || 'CONSULTOR') === 'CONSULTOR');

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return { label: 'Admin', icon: <Crown size={13} />, bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
      case 'DIRETORIA':
        return { label: 'Diretoria', icon: <Award size={13} />, bg: '#F3E8FF', text: '#6B21A8', border: '#E9D5FF' };
      case 'GERENTE_NACIONAL':
        return { label: 'Ger. Nacional', icon: <Target size={13} />, bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' };
      case 'GERENTE_REGIONAL':
        return { label: 'Ger. Regional', icon: <MapPin size={13} />, bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' };
      case 'CONSULTOR':
        return { label: 'Consultor', icon: <Briefcase size={13} />, bg: '#FFF7ED', text: '#C2410C', border: '#FFEDD5' };
      default:
        return { label: 'Admin', icon: <ShieldCheck size={13} />, bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
    }
  };

  const currentBadge = getRoleBadge(simulatedRole);

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Botão Seletor no Topo */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          background: 'rgba(255, 255, 255, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          color: '#FFFFFF',
          padding: '0.35rem 0.75rem',
          borderRadius: 'var(--radius-full)',
          cursor: 'pointer',
          fontSize: '0.78rem',
          fontWeight: 600,
          transition: 'all 0.15s ease',
          backdropFilter: 'blur(4px)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
        }}
        title="Clique para simular a visão de qualquer cargo da hierarquia"
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', opacity: 0.9 }}>
          <Eye size={14} />
          <span className="role-sim-text" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.4px', opacity: 0.85 }}>Ver como:</span>
        </span>

        <span style={{ 
          background: currentBadge.bg, 
          color: currentBadge.text, 
          border: `1px solid ${currentBadge.border}`,
          padding: '0.12rem 0.5rem', 
          borderRadius: '12px',
          fontWeight: 800,
          fontSize: '0.72rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          {currentBadge.icon}
          <span>{currentBadge.label}</span>
        </span>

        <span className="role-sim-user" style={{ 
          maxWidth: '120px', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          color: '#FFFFFF',
          fontSize: '0.75rem'
        }}>
          {activeUser?.name?.split(' ')[0] || ''}
        </span>

        <ChevronDown size={13} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
      </button>

      {/* Menu Dropdown de Simulação */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '320px',
          maxHeight: '440px',
          overflowY: 'auto',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          padding: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
          animation: 'fadeIn 0.15s ease'
        }}>
          <div style={{ padding: '0.35rem 0.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.2rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary-brown)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Simulador de Perfis (Hierarquia Spoleto)
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              Teste em tempo real como cada nível hierárquico enxerga a rede, lojas e relatórios.
            </div>
          </div>

          {/* 1. DIRETORIA NACIONAL */}
          <div 
            onClick={() => {
              changeSimulatedProfile('DIRETORIA');
              setIsOpen(false);
            }}
            style={{
              padding: '0.55rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              backgroundColor: simulatedRole === 'DIRETORIA' ? '#F3E8FF' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.12s ease'
            }}
            onMouseEnter={(e) => {
              if (simulatedRole !== 'DIRETORIA') e.currentTarget.style.backgroundColor = '#F8FAFC';
            }}
            onMouseLeave={(e) => {
              if (simulatedRole !== 'DIRETORIA') e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#E9D5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B21A8' }}>
                <Award size={15} />
              </div>
              <div>
                <strong style={{ fontSize: '0.82rem', color: '#0F172A', display: 'block' }}>⭐ Diretoria (Rafael Pardo)</strong>
                <span style={{ fontSize: '0.7rem', color: '#64748B' }}>Visão Macro 100% Brasil (todas as 409 lojas)</span>
              </div>
            </div>
            {simulatedRole === 'DIRETORIA' && <Check size={16} color="#6B21A8" />}
          </div>

          {/* 3. GERÊNCIA NACIONAL */}
          <div 
            onClick={() => {
              changeSimulatedProfile('GERENTE_NACIONAL');
              setIsOpen(false);
            }}
            style={{
              padding: '0.55rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              backgroundColor: simulatedRole === 'GERENTE_NACIONAL' ? '#E0F2FE' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.12s ease'
            }}
            onMouseEnter={(e) => {
              if (simulatedRole !== 'GERENTE_NACIONAL') e.currentTarget.style.backgroundColor = '#F8FAFC';
            }}
            onMouseLeave={(e) => {
              if (simulatedRole !== 'GERENTE_NACIONAL') e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#BAE6FD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369A1' }}>
                <Target size={15} />
              </div>
              <div>
                <strong style={{ fontSize: '0.82rem', color: '#0F172A', display: 'block' }}>🎯 Gerência Nacional (Liliane Cury)</strong>
                <span style={{ fontSize: '0.7rem', color: '#64748B' }}>Gestão nacional de consultores, regionais e KPIs</span>
              </div>
            </div>
            {simulatedRole === 'GERENTE_NACIONAL' && <Check size={16} color="#0369A1" />}
          </div>

          {/* 4. GERENTES REGIONAIS (Submenu) */}
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.35rem', marginTop: '0.2rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.2rem 0.65rem' }}>
              🗺️ Gerentes Regionais (Visão por Polo)
            </div>
            {regionalManagers.map(gr => {
              const isSelected = simulatedRole === 'GERENTE_REGIONAL' && activeUser?.id === gr.id;
              return (
                <div
                  key={gr.id}
                  onClick={() => {
                    changeSimulatedProfile('GERENTE_REGIONAL', gr.id);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '0.45rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#ECFDF5' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.78rem', color: isSelected ? '#047857' : '#0F172A', display: 'block' }}>
                      {gr.name}
                    </strong>
                    <span style={{ fontSize: '0.68rem', color: '#64748B' }}>{gr.region}</span>
                  </div>
                  {isSelected && <Check size={14} color="#047857" />}
                </div>
              );
            })}
          </div>

          {/* 5. CONSULTORES DE NEGÓCIOS (Submenu) */}
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.35rem', marginTop: '0.2rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.2rem 0.65rem' }}>
              💼 Consultores (Visão Individual da Carteira)
            </div>
            <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
              {businessConsultants.map(cons => {
                const isSelected = simulatedRole === 'CONSULTOR' && activeUser?.id === cons.id;
                const storeCount = cons.assignedStores?.length || cons.storesCount || 0;

                return (
                  <div
                    key={cons.id}
                    onClick={() => {
                      changeSimulatedProfile('CONSULTOR', cons.id);
                      setIsOpen(false);
                    }}
                    style={{
                      padding: '0.45rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#FFF7ED' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.12s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.78rem', color: isSelected ? '#C2410C' : '#0F172A', display: 'block' }}>
                        {cons.name}
                      </strong>
                      <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                        {cons.region} ({storeCount} lojas)
                      </span>
                    </div>
                    {isSelected && <Check size={14} color="#C2410C" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
