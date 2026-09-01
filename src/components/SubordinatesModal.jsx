import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatPhoneNumber } from '../utils/dateHelpers';
import { 
  Users, 
  Search, 
  X, 
  CheckSquare, 
  Square, 
  Check, 
  Award, 
  MapPin, 
  Filter, 
  Building2, 
  ChevronRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export default function SubordinatesModal() {
  const { 
    consultants, 
    managingSubordinatesLeader, 
    setManagingSubordinatesLeader, 
    assignSubordinates,
    setSelectedStaffForProfile
  } = useApp();

  const [selectedSubordinateIds, setSelectedSubordinateIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const leader = managingSubordinatesLeader;

  // Initialize selected subordinates when modal opens
  useEffect(() => {
    if (leader) {
      const currentSubIds = consultants
        .filter(c => c.reportsTo === leader.id)
        .map(c => c.id);
      setSelectedSubordinateIds(currentSubIds);
      setSearchTerm('');
      setRoleFilter('ALL');
    }
  }, [leader, consultants]);

  if (!leader) return null;

  const leaderRole = leader.role || 'GERENTE_REGIONAL';

  // Role tag helper
  const getRoleBadge = (role) => {
    switch (role) {
      case 'DIRETORIA':
        return { label: '🏛️ Diretoria', bg: '#FEF3C7', color: '#92400E' };
      case 'GERENTE_NACIONAL':
        return { label: '🌐 Gerência Nacional', bg: '#E0E7FF', color: '#3730A3' };
      case 'GERENTE_REGIONAL':
        return { label: '🏢 Gerência Regional', bg: '#EDE9FE', color: '#5B21B6' };
      case 'CONSULTOR':
      default:
        return { label: '👨‍💼 Consultor', bg: '#F3F4F6', color: '#374151' };
    }
  };

  const leaderBadge = getRoleBadge(leaderRole);

  // Eligible subordinates based on leader's role (excluding leader himself)
  const eligibleMembers = consultants.filter(c => {
    if (c.id === leader.id) return false;
    // Diretoria can lead Gerentes Nacionais, Gerentes Regionais and Consultores
    if (leaderRole === 'DIRETORIA') {
      return c.role !== 'DIRETORIA';
    }
    // Gerente Nacional can lead Gerentes Regionais and Consultores
    if (leaderRole === 'GERENTE_NACIONAL') {
      return c.role === 'GERENTE_REGIONAL' || c.role === 'CONSULTOR';
    }
    // Gerente Regional leads Consultores
    if (leaderRole === 'GERENTE_REGIONAL') {
      return c.role === 'CONSULTOR' || c.role === 'GERENTE_REGIONAL';
    }
    return true;
  });

  // Filter by search and role filter tab
  const filteredMembers = eligibleMembers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.region && c.region.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (roleFilter === 'ALL') return true;
    return c.role === roleFilter;
  });

  // Toggle single subordinate
  const handleToggleSubordinate = (memberId) => {
    setSelectedSubordinateIds(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  // Select all filtered
  const handleSelectAllFiltered = () => {
    const filteredIds = filteredMembers.map(m => m.id);
    setSelectedSubordinateIds(prev => Array.from(new Set([...prev, ...filteredIds])));
  };

  // Deselect all filtered
  const handleDeselectAllFiltered = () => {
    const filteredIds = new Set(filteredMembers.map(m => m.id));
    setSelectedSubordinateIds(prev => prev.filter(id => !filteredIds.has(id)));
  };

  // Save changes
  const handleSave = () => {
    assignSubordinates(leader.id, selectedSubordinateIds);
    setManagingSubordinatesLeader(null);
  };

  return (
    <div className="modal-overlay" onClick={() => setManagingSubordinatesLeader(null)}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '850px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '1.75rem' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              border: '2px solid var(--accent-gold)',
              overflow: 'hidden',
              backgroundColor: 'var(--primary-brown-light)',
              color: 'var(--primary-brown)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.15rem',
              flexShrink: 0
            }}>
              {leader.photoUrl ? (
                <img src={leader.photoUrl} alt={leader.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                leader.name.split(' ').map(n => n[0]).slice(0, 2).join('')
              )}
            </div>
            <div>
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                Atribuição de Liderados Diretos da Equipe
              </h2>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                Líder: <strong style={{ color: 'var(--text-main)' }}>{leader.name}</strong>
                <span style={{ fontSize: '0.72rem', background: leaderBadge.bg, color: leaderBadge.color, padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
                  {leaderBadge.label}
                </span>
                <span>&bull; {leader.region}</span>
              </div>
            </div>
          </div>

          <button className="modal-close" onClick={() => setManagingSubordinatesLeader(null)}>
            <X size={20} />
          </button>
        </div>

        {/* Counter and Quick Actions Banner */}
        <div style={{ 
          background: '#FAF8F5', 
          border: '1px solid var(--border-subtle)', 
          padding: '0.75rem 1.25rem', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: '1rem', 
          fontSize: '0.84rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            <strong style={{ color: 'var(--primary-brown)', fontSize: '1rem' }}>{selectedSubordinateIds.length}</strong> colaborador(es) selecionado(s) para responder diretamente a <strong style={{ color: 'var(--text-main)' }}>{leader.name}</strong>.
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              type="button" 
              className="btn-secondary" 
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
              onClick={handleSelectAllFiltered}
            >
              <CheckSquare size={13} /> Marcar Filtrados ({filteredMembers.length})
            </button>
            <button 
              type="button" 
              className="btn-secondary" 
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
              onClick={handleDeselectAllFiltered}
            >
              <Square size={13} /> Desmarcar Filtrados
            </button>
          </div>
        </div>

        {/* Search and Role Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou região do colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.2rem', fontSize: '0.82rem', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn-secondary ${roleFilter === 'ALL' ? 'btn-primary' : ''}`}
              onClick={() => setRoleFilter('ALL')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
            >
              Todos ({eligibleMembers.length})
            </button>

            {eligibleMembers.some(c => c.role === 'GERENTE_REGIONAL') && (
              <button
                type="button"
                className={`btn-secondary ${roleFilter === 'GERENTE_REGIONAL' ? 'btn-primary' : ''}`}
                onClick={() => setRoleFilter('GERENTE_REGIONAL')}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
              >
                🏢 Gerentes Regionais
              </button>
            )}

            {eligibleMembers.some(c => c.role === 'CONSULTOR') && (
              <button
                type="button"
                className={`btn-secondary ${roleFilter === 'CONSULTOR' ? 'btn-primary' : ''}`}
                onClick={() => setRoleFilter('CONSULTOR')}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
              >
                👨‍💼 Consultores
              </button>
            )}
          </div>
        </div>

        {/* Subordinates Selection List */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          border: '1px solid var(--border-subtle)', 
          borderRadius: 'var(--radius-md)', 
          padding: '0.75rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '0.75rem',
          maxHeight: '440px',
          background: '#FAF8F5'
        }}>
          {filteredMembers.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Nenhum colaborador encontrado com os filtros aplicados.
            </div>
          ) : (
            filteredMembers.map(member => {
              const isSelected = selectedSubordinateIds.includes(member.id);
              const memberBadge = getRoleBadge(member.role);
              
              // Find who this member currently reports to if not this leader
              const currentSuperior = consultants.find(c => c.id === member.reportsTo);
              const isAlreadyMySub = member.reportsTo === leader.id;

              return (
                <div
                  key={member.id}
                  onClick={() => handleToggleSubordinate(member.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: `1.5px solid ${isSelected ? 'var(--primary-brown)' : 'var(--border-subtle)'}`,
                    backgroundColor: isSelected ? '#FFFFFF' : '#F9FAFB',
                    boxShadow: isSelected ? '0 2px 5px rgba(93, 56, 38, 0.08)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Custom Checkbox */}
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    border: `2px solid ${isSelected ? 'var(--primary-brown)' : '#D1D5DB'}`,
                    backgroundColor: isSelected ? 'var(--primary-brown)' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}>
                    {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                  </div>

                  {/* Photo / Initials */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-brown-light)',
                    color: 'var(--primary-brown)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    {member.photoUrl ? (
                      <img src={member.photoUrl} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      member.name.split(' ').map(n => n[0]).slice(0, 2).join('')
                    )}
                  </div>

                  {/* Member Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', marginBottom: '0.15rem' }}>
                      <strong style={{ fontSize: '0.86rem', color: isSelected ? 'var(--primary-brown)' : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {member.name}
                      </strong>
                      <span style={{ fontSize: '0.7rem', background: memberBadge.bg, color: memberBadge.color, padding: '0.1rem 0.35rem', borderRadius: '3px', fontWeight: 700, flexShrink: 0 }}>
                        {memberBadge.label}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin size={11} /> {member.region}
                      {member.phone && <span>&bull; {formatPhoneNumber(member.phone)}</span>}
                    </div>

                    {/* Subordination Status Indicator */}
                    <div style={{ marginTop: '0.25rem', fontSize: '0.72rem' }}>
                      {isSelected ? (
                        <span style={{ color: '#166534', fontWeight: 700 }}>
                          ✓ Liderado Direto Atribuído
                        </span>
                      ) : currentSuperior ? (
                        <span style={{ color: '#9A3412' }}>
                          Reporta atualmente para: <strong>{currentSuperior.name}</strong>
                        </span>
                      ) : (
                        <span style={{ color: '#6B7280', fontStyle: 'italic' }}>
                          Sem líder direto atribuído
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Total: <strong>{selectedSubordinateIds.length}</strong> liderado(s) direto(s) para <strong>{leader.name}</strong>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => setManagingSubordinatesLeader(null)}
            >
              Cancelar
            </button>
            <button 
              type="button" 
              className="btn-primary"
              onClick={handleSave}
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <UserCheck size={16} /> Salvar Liderados da Equipe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
