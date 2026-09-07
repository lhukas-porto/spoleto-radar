import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Layers, 
  Building2, 
  Calendar,
  MapPin,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import TaxonomyView from './TaxonomyView';
import InternalAreasManager from './InternalAreasManager';
import RegionsManager from './RegionsManager';
import WorkShiftsManager from './WorkShiftsManager';
import RolePermissionsManager from './RolePermissionsManager';

export default function SettingsView({ defaultSubTab = 'taxonomy' }) {
  const { isAdminUnlocked, hasPermission } = useApp();
  const [activeSubTab, setActiveSubTab] = useState(defaultSubTab);

  // Se o modo Administrador for desativado e o usuário estiver na aba de permissões,
  // volta imediatamente para a aba de taxonomia para a tela não ficar em branco
  useEffect(() => {
    if (!isAdminUnlocked && activeSubTab === 'permissions') {
      setActiveSubTab('taxonomy');
    }
  }, [isAdminUnlocked, activeSubTab]);

  return (
    <div>
      {/* Header Principal de Configurações */}
      <div className="section-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Settings size={26} color="var(--primary-brown)" />
            Configurações do Sistema
          </h1>
          <p className="section-subtitle">
            Gerencie os parâmetros operacionais da rede Spoleto: Matriz de Tópicos, Áreas Internas, Regiões Oficiais, Escalas da Equipe e Controle de Acessos.
          </p>
        </div>
      </div>

      {/* Abas Superiores de Configurações - Mantidas na mesma linha */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-end',
        gap: '0.4rem', 
        marginBottom: '1.5rem', 
        borderBottom: '2px solid var(--border-subtle)',
        paddingBottom: '0',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        scrollbarWidth: 'none'
      }}>
        {(isAdminUnlocked || hasPermission('settings_taxonomy')) && (
          <button
            type="button"
            onClick={() => setActiveSubTab('taxonomy')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1.05rem',
              fontSize: '0.86rem',
              fontWeight: activeSubTab === 'taxonomy' ? 800 : 600,
              color: activeSubTab === 'taxonomy' ? 'var(--primary-brown)' : 'var(--text-muted)',
              borderBottom: activeSubTab === 'taxonomy' ? '3px solid var(--primary-brown)' : '3px solid transparent',
              background: activeSubTab === 'taxonomy' ? 'var(--primary-brown-light)' : 'transparent',
              borderTopLeftRadius: 'var(--radius-md)',
              borderTopRightRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              marginBottom: '-2px',
              flexShrink: 0
            }}
          >
            <Layers size={17} />
            Matriz de Tópicos
          </button>
        )}

        {(isAdminUnlocked || hasPermission('settings_internal_areas')) && (
          <button
            type="button"
            onClick={() => setActiveSubTab('internal-areas')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1.05rem',
              fontSize: '0.86rem',
              fontWeight: activeSubTab === 'internal-areas' ? 800 : 600,
              color: activeSubTab === 'internal-areas' ? 'var(--primary-brown)' : 'var(--text-muted)',
              borderBottom: activeSubTab === 'internal-areas' ? '3px solid var(--primary-brown)' : '3px solid transparent',
              background: activeSubTab === 'internal-areas' ? 'var(--primary-brown-light)' : 'transparent',
              borderTopLeftRadius: 'var(--radius-md)',
              borderTopRightRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              marginBottom: '-2px',
              flexShrink: 0
            }}
          >
            <Building2 size={17} />
            Áreas Internas
          </button>
        )}

        {/* Sub-Aba de Regiões & Polos Operacionais */}
        <button
          type="button"
          onClick={() => setActiveSubTab('regions')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.6rem 1.05rem',
            fontSize: '0.86rem',
            fontWeight: activeSubTab === 'regions' ? 800 : 600,
            color: activeSubTab === 'regions' ? 'var(--primary-brown)' : 'var(--text-muted)',
            borderBottom: activeSubTab === 'regions' ? '3px solid var(--primary-brown)' : '3px solid transparent',
            background: activeSubTab === 'regions' ? 'var(--primary-brown-light)' : 'transparent',
            borderTopLeftRadius: 'var(--radius-md)',
            borderTopRightRadius: 'var(--radius-md)',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            marginBottom: '-2px',
            flexShrink: 0
          }}
        >
          <MapPin size={17} />
          Regiões da Rede
        </button>

        {/* Sub-Aba de Escalas de Colaboradores */}
        <button
          type="button"
          onClick={() => setActiveSubTab('work-shifts')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.6rem 1.05rem',
            fontSize: '0.86rem',
            fontWeight: activeSubTab === 'work-shifts' ? 800 : 600,
            color: activeSubTab === 'work-shifts' ? 'var(--primary-brown)' : 'var(--text-muted)',
            borderBottom: activeSubTab === 'work-shifts' ? '3px solid var(--primary-brown)' : '3px solid transparent',
            background: activeSubTab === 'work-shifts' ? 'var(--primary-brown-light)' : 'transparent',
            borderTopLeftRadius: 'var(--radius-md)',
            borderTopRightRadius: 'var(--radius-md)',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            marginBottom: '-2px',
            flexShrink: 0
          }}
        >
          <Calendar size={17} />
          Escalas de Colaboradores
        </button>

        {/* Aba Exclusiva do Administrador Master (Visível apenas quando desbloqueado, perfeitamente alinhada na mesma linha) */}
        {isAdminUnlocked && (
          <button
            type="button"
            onClick={() => setActiveSubTab('permissions')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1.05rem',
              fontSize: '0.86rem',
              fontWeight: activeSubTab === 'permissions' ? 800 : 600,
              color: activeSubTab === 'permissions' ? '#92400E' : '#B45309',
              borderBottom: activeSubTab === 'permissions' ? '3px solid #D97706' : '3px solid transparent',
              background: activeSubTab === 'permissions' ? '#FEF3C7' : 'rgba(254, 243, 199, 0.4)',
              borderTopLeftRadius: 'var(--radius-md)',
              borderTopRightRadius: 'var(--radius-md)',
              border: '1px dashed #F59E0B',
              borderBottomWidth: activeSubTab === 'permissions' ? '3px' : '1px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              marginBottom: '-2px',
              flexShrink: 0
            }}
          >
            <ShieldCheck size={17} color="#D97706" />
            <span>Controle de Acessos & Permissões</span>
            <span style={{ 
              fontSize: '0.65rem', 
              background: '#92400E', 
              color: '#FFFFFF', 
              padding: '0.12rem 0.4rem', 
              borderRadius: '10px', 
              fontWeight: 800,
              letterSpacing: '0.4px'
            }}>
              ADMIN
            </span>
          </button>
        )}
      </div>

      {/* Conteúdo da Sub-Aba Ativa */}
      {activeSubTab === 'taxonomy' && <TaxonomyView />}
      {activeSubTab === 'internal-areas' && <InternalAreasManager />}
      {activeSubTab === 'regions' && <RegionsManager />}
      {activeSubTab === 'work-shifts' && <WorkShiftsManager />}
      {activeSubTab === 'permissions' && (
        isAdminUnlocked ? <RolePermissionsManager /> : <TaxonomyView />
      )}
    </div>
  );
}


