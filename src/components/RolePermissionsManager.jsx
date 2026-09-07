import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  Check, 
  X, 
  RotateCcw, 
  Save, 
  Lock, 
  Info, 
  Crown, 
  Target, 
  Compass, 
  Briefcase,
  Layers,
  HelpCircle
} from 'lucide-react';

export default function RolePermissionsManager() {
  const { 
    permissionsModules, 
    rolesList, 
    updateRolePermission, 
    resetPermissionsToDefault,
    showToast 
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Agrupamento de categorias
  const categories = ['ALL', ...Array.from(new Set((permissionsModules || []).map(m => m.category)))];

  const filteredModules = (permissionsModules || []).filter(mod => {
    const matchesCat = selectedCategory === 'ALL' || mod.category === selectedCategory;
    const matchesSearch = mod.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          mod.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          mod.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getRoleIcon = (roleId) => {
    switch (roleId) {
      case 'DIRETORIA': return <Crown size={18} color="#B45309" />;
      case 'GERENTE_NACIONAL': return <Target size={18} color="#D97706" />;
      case 'GERENTE_REGIONAL': return <Compass size={18} color="#2563EB" />;
      case 'CONSULTOR': return <Briefcase size={18} color="#16A34A" />;
      default: return <ShieldCheck size={18} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Banner Explicativo de Governança */}
      <div style={{
        background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
        border: '1px solid #FCD34D',
        borderRadius: 'var(--radius-lg, 12px)',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 2px 8px rgba(180, 83, 9, 0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '850px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#B45309',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            flexShrink: 0,
            boxShadow: '0 4px 10px rgba(180, 83, 9, 0.25)'
          }}>
            <Lock size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#92400E' }}>
              Matriz de Permissões & Alçadas (RBAC — Administrador Master)
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#B45309', lineHeight: 1.4 }}>
              Defina com precisão o que cada nível da rede Spoleto pode visualizar, criar ou editar no sistema.
              As alterações têm efeito imediato nas telas e relatórios de todos os usuários.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (confirm('Deseja restaurar todas as permissões dos 4 perfis para a regra de negócio padrão da Spoleto?')) {
              resetPermissionsToDefault();
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.6rem 1.1rem',
            backgroundColor: '#FFFFFF',
            border: '1px solid #D97706',
            color: '#92400E',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#FEF3C7';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
          }}
          title="Restaurar padrão corporativo"
        >
          <RotateCcw size={15} /> Restaurar Padrão
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        background: '#FFFFFF',
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-md, 10px)',
        border: '1px solid var(--border-subtle, #E2E8F0)'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary, #475569)', marginRight: '0.3rem' }}>
            Filtrar por Módulo:
          </span>
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: selectedCategory === cat ? 800 : 600,
                backgroundColor: selectedCategory === cat ? 'var(--primary-brown, #5D3826)' : 'var(--bg-subtle, #F1F5F9)',
                color: selectedCategory === cat ? '#FFFFFF' : 'var(--text-secondary, #475569)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {cat === 'ALL' ? 'Todos os Módulos' : cat}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Buscar funcionalidade ou permissão..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '0.5rem 0.9rem',
            fontSize: '0.85rem',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle, #CBD5E1)',
            minWidth: '260px',
            outline: 'none'
          }}
        />
      </div>

      {/* Tabela Interativa de Matriz RBAC */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg, 12px)',
        border: '1px solid var(--border-subtle, #E2E8F0)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#FAF8F5', borderBottom: '2px solid #E2D9D2' }}>
                <th style={{ padding: '1rem 1.25rem', width: '38%', color: 'var(--primary-brown, #5D3826)', fontSize: '0.88rem', fontWeight: 800 }}>
                  MÓDULO & FUNCIONALIDADE
                </th>
                {(rolesList || []).map(role => (
                  <th 
                    key={role.id} 
                    style={{ 
                      padding: '1rem 0.75rem', 
                      textAlign: 'center', 
                      width: '15.5%',
                      borderLeft: '1px solid #EDE4DE'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: role.color, fontWeight: 800, fontSize: '0.88rem' }}>
                        {getRoleIcon(role.id)}
                        {role.name}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748B)', fontWeight: 500 }}>
                        {role.label}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredModules.map((mod, idx) => (
                <tr 
                  key={mod.id}
                  style={{ 
                    borderBottom: '1px solid #F1F5F9',
                    backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FCFBFA',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FDF6EE';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#FFFFFF' : '#FCFBFA';
                  }}
                >
                  {/* Detalhes do Módulo */}
                  <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                    <div style={{ display: 'inline-block', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--accent-gold-dark, #8C6239)', marginBottom: '0.25rem' }}>
                      {mod.category}
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary, #1E293B)', marginBottom: '0.2rem' }}>
                      {mod.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748B)', lineHeight: 1.35 }}>
                      {mod.description}
                    </div>
                  </td>

                  {/* Colunas por Cargo com Toggle Interativo */}
                  {(rolesList || []).map(role => {
                    const rolePerm = mod.permissions?.[role.id] || { enabled: false, note: '' };
                    const isEnabled = !!rolePerm.enabled;

                    return (
                      <td 
                        key={role.id}
                        style={{ 
                          padding: '0.85rem 0.5rem', 
                          textAlign: 'center', 
                          verticalAlign: 'middle',
                          borderLeft: '1px solid #F1F5F9'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem' }}>
                          {/* Botão Switch / Toggle Interativo */}
                          <button
                            type="button"
                            onClick={() => {
                              updateRolePermission(mod.id, role.id, !isEnabled);
                              showToast(`Permissão "${mod.name}" para ${role.name}: ${!isEnabled ? 'HABILITADA' : 'BLOQUEADA'}`);
                            }}
                            title={`Clique para ${isEnabled ? 'bloquear' : 'liberar'} para ${role.name}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.35rem',
                              width: '110px',
                              padding: '0.45rem 0.6rem',
                              borderRadius: '20px',
                              border: isEnabled ? '1px solid #86EFAC' : '1px solid #FECDD3',
                              backgroundColor: isEnabled ? '#F0FDF4' : '#FFF1F2',
                              color: isEnabled ? '#15803D' : '#BE123C',
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: isEnabled ? '0 2px 6px rgba(22, 163, 74, 0.12)' : '0 1px 3px rgba(225, 29, 72, 0.08)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.04)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            {isEnabled ? (
                              <>
                                <Check size={14} strokeWidth={3} />
                                <span>Permitido</span>
                              </>
                            ) : (
                              <>
                                <X size={14} strokeWidth={3} />
                                <span>Bloqueado</span>
                              </>
                            )}
                          </button>

                          {/* Nota de Regra de Negócio Específica */}
                          {rolePerm.note && (
                            <span 
                              style={{ 
                                fontSize: '0.7rem', 
                                color: isEnabled ? 'var(--text-secondary, #475569)' : 'var(--text-muted, #94A3B8)',
                                lineHeight: 1.2,
                                maxWidth: '125px',
                                textAlign: 'center'
                              }}
                            >
                              {rolePerm.note}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
