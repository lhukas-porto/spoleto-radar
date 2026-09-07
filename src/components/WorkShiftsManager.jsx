import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calendar, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Sparkles,
  Info,
  Layers,
  HelpCircle,
  Building2,
  Clock,
  Briefcase,
  AlertCircle
} from 'lucide-react';

export default function WorkShiftsManager() {
  const { 
    workShifts, 
    addWorkShift, 
    updateWorkShift, 
    deleteWorkShift, 
    stores,
    isAdminUnlocked,
    hasPermission 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // Novo cadastro
  const [newName, setNewName] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColorTheme, setNewColorTheme] = useState('green');

  // Edição
  const [editingShift, setEditingShift] = useState(null);
  const [editName, setEditName] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editColorTheme, setEditColorTheme] = useState('green');

  // Pode editar se for admin ou tiver a permissão settings_work_shifts
  const canManage = isAdminUnlocked || hasPermission('settings_work_shifts');

  const COLOR_THEMES = [
    { id: 'green', label: 'Verde (Varejo / Shopping)', bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
    { id: 'blue', label: 'Azul (Comercial / Adm)', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
    { id: 'amber', label: 'Âmbar (Jornada 12h)', bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
    { id: 'purple', label: 'Púrpura (Mista)', bg: '#F3E8FF', color: '#6B21A8', border: '#E9D5FF' },
    { id: 'rose', label: 'Rosa (Especial)', bg: '#FFE4E6', color: '#BE123C', border: '#FECDD3' },
    { id: 'slate', label: 'Cinza Neutro', bg: '#F1F5F9', color: '#334155', border: '#CBD5E1' }
  ];

  const getColorStyles = (themeId) => {
    const found = COLOR_THEMES.find(t => t.id === themeId);
    return found || COLOR_THEMES[0];
  };

  const getThemeFromStyles = (shift) => {
    if (shift.badgeBg === '#EFF6FF') return 'blue';
    if (shift.badgeBg === '#FEF3C7') return 'amber';
    if (shift.badgeBg === '#F3E8FF') return 'purple';
    if (shift.badgeBg === '#FFE4E6') return 'rose';
    if (shift.badgeBg === '#F1F5F9') return 'slate';
    return 'green';
  };

  // Contagem de lojas que usam cada escala
  const getStoresCountForShift = (shiftName) => {
    if (!shiftName) return 0;
    return (stores || []).filter(st => (st.workShift || '6x1') === shiftName).length;
  };

  // Filtro de escalas
  const filteredShifts = (workShifts || []).filter(shift => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (shift.name || '').toLowerCase().includes(q) ||
           (shift.label || '').toLowerCase().includes(q) ||
           (shift.description || '').toLowerCase().includes(q);
  });

  const handleCreateShift = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const theme = getColorStyles(newColorTheme);

    addWorkShift({
      name: newName.trim(),
      label: newLabel.trim() || newName.trim(),
      description: newDesc.trim() || 'Escala operacional de colaboradores',
      badgeBg: theme.bg,
      badgeColor: theme.color,
      badgeBorder: theme.border
    });

    setNewName('');
    setNewLabel('');
    setNewDesc('');
    setIsAdding(false);
  };

  const handleStartEdit = (shift) => {
    setEditingShift(shift);
    setEditName(shift.name);
    setEditLabel(shift.label || shift.name);
    setEditDesc(shift.description || '');
    setEditColorTheme(getThemeFromStyles(shift));
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingShift || !editName.trim()) return;

    const theme = getColorStyles(editColorTheme);

    updateWorkShift(editingShift.id, {
      name: editName.trim(),
      label: editLabel.trim() || editName.trim(),
      description: editDesc.trim(),
      badgeBg: theme.bg,
      badgeColor: theme.color,
      badgeBorder: theme.border
    });

    setEditingShift(null);
  };

  const handleDelete = (shift) => {
    const storesUsing = getStoresCountForShift(shift.name);
    if (storesUsing > 0) {
      alert(`Atenção: Existem ${storesUsing} loja(s) vinculadas a esta escala (${shift.name}). Para poder excluí-la, reatribua essas unidades para outra escala primeiro na tela de Rede de Lojas.`);
      return;
    }

    if (window.confirm(`Tem certeza que deseja remover a escala "${shift.name}"?`)) {
      deleteWorkShift(shift.id);
    }
  };

  return (
    <div>
      {/* Header com Ações */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.85rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-brown)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Calendar size={22} color="var(--accent-gold)" />
            Escalas de Colaboradores da Rede
          </h2>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Configure os modelos de jornadas de trabalho das equipes (6x1, 5x2, 12x36, etc.) e acompanhe a distribuição pelas 409 lojas.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setIsAdding(!isAdding);
              setEditingShift(null);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', fontSize: '0.86rem' }}
          >
            {isAdding ? <X size={16} /> : <Plus size={16} />}
            {isAdding ? 'Cancelar' : 'Nova Escala'}
          </button>
        )}
      </div>

      {/* Alerta de Modo de Permissão caso o usuário não tenha permissão de gerenciar */}
      {!canManage && (
        <div style={{
          background: '#FEF3C7',
          border: '1px solid #FCD34D',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.85rem',
          color: '#92400E'
        }}>
          <AlertCircle size={18} color="#D97706" style={{ flexShrink: 0 }} />
          <span>
            <strong>Modo Somente Leitura:</strong> Seu cargo atual pode consultar as escalas cadastradas, mas apenas perfis autorizados pelo Administrador Master podem criar, editar ou excluir escalas.
          </span>
        </div>
      )}

      {/* Formulário de Criação Rápida */}
      {isAdding && canManage && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: '#FAFAFA', border: '2px solid var(--accent-gold)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontWeight: 800, color: 'var(--primary-brown)', fontSize: '0.95rem' }}>
            <Sparkles size={18} color="var(--accent-gold)" />
            Cadastrar Nova Escala Operacional
          </div>

          <form onSubmit={handleCreateShift}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Código / Sigla *</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  placeholder="Ex: 6x1, 5x2, 12x36, 4x3..."
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Rótulo Descritivo Completo</label>
                <input 
                  type="text" 
                  value={newLabel} 
                  onChange={(e) => setNewLabel(e.target.value)} 
                  placeholder="Ex: 6x1 (Padrão Varejo / Shopping)"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Tema Visual / Tag</label>
                <select 
                  value={newColorTheme} 
                  onChange={(e) => setNewColorTheme(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {COLOR_THEMES.map(theme => (
                    <option key={theme.id} value={theme.id}>{theme.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Descrição & Diretrizes Operacionais</label>
              <textarea 
                rows={2}
                value={newDesc} 
                onChange={(e) => setNewDesc(e.target.value)} 
                placeholder="Explique os horários, folgas e contexto operacional desta jornada de trabalho..."
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setIsAdding(false)}
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.84rem' }}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ padding: '0.45rem 1.1rem', fontSize: '0.84rem' }}
              >
                Salvar Escala
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barra de Pesquisa */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Buscar por sigla, nome ou descrição..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.25rem', fontSize: '0.86rem' }}
          />
        </div>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {filteredShifts.length} {filteredShifts.length === 1 ? 'escala encontrada' : 'escalas encontradas'}
        </span>
      </div>

      {/* Grid de Cards das Escalas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {filteredShifts.map((shift) => {
          const storesCount = getStoresCountForShift(shift.name);
          const isEditingThis = editingShift && editingShift.id === shift.id;

          if (isEditingThis) {
            return (
              <div key={shift.id} className="card" style={{ padding: '1.25rem', border: '2px solid var(--primary-brown)', background: '#FAFAFA' }}>
                <form onSubmit={handleSaveEdit}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-brown)', textTransform: 'uppercase' }}>
                      Editando Escala
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setEditingShift(null)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="form-group" style={{ marginBottom: '0.7rem' }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Código / Sigla *</label>
                    <input 
                      type="text" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                      required
                      style={{ width: '100%', fontSize: '0.88rem' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '0.7rem' }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Rótulo Descritivo</label>
                    <input 
                      type="text" 
                      value={editLabel} 
                      onChange={(e) => setEditLabel(e.target.value)} 
                      style={{ width: '100%', fontSize: '0.88rem' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '0.7rem' }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Tema Visual / Tag</label>
                    <select 
                      value={editColorTheme} 
                      onChange={(e) => setEditColorTheme(e.target.value)}
                      style={{ width: '100%', fontSize: '0.88rem' }}
                    >
                      {COLOR_THEMES.map(theme => (
                        <option key={theme.id} value={theme.id}>{theme.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Descrição</label>
                    <textarea 
                      rows={2}
                      value={editDesc} 
                      onChange={(e) => setEditDesc(e.target.value)} 
                      style={{ width: '100%', fontSize: '0.84rem', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setEditingShift(null)}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Check size={14} /> Salvar
                    </button>
                  </div>
                </form>
              </div>
            );
          }

          return (
            <div 
              key={shift.id} 
              className="card" 
              style={{ 
                padding: '1.15rem', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                border: '1px solid var(--border-subtle)',
                position: 'relative'
              }}
            >
              <div>
                {/* Cabeçalho do Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ 
                      backgroundColor: shift.badgeBg || '#F0FDF4', 
                      color: shift.badgeColor || '#15803D', 
                      border: `1px solid ${shift.badgeBorder || '#BBF7D0'}`,
                      padding: '0.25rem 0.65rem', 
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem', 
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      letterSpacing: '0.2px'
                    }}>
                      📅 {shift.name}
                    </span>

                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 700,
                      color: 'var(--text-secondary)'
                    }}>
                      {shift.label !== shift.name ? shift.label : ''}
                    </span>
                  </div>

                  {canManage && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(shift)}
                        title="Editar escala"
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '0.35rem',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          color: 'var(--text-muted)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-brown)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <Edit2 size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(shift)}
                        title="Excluir escala"
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '0.35rem',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          color: storesCount > 0 ? '#CBD5E1' : '#EF4444'
                        }}
                        disabled={storesCount > 0}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Descrição */}
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '0 0 1rem 0' }}>
                  {shift.description || 'Sem descrição cadastrada.'}
                </p>
              </div>

              {/* Rodapé do Card com Quantidade de Lojas que usam essa Escala */}
              <div style={{
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '0.65rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
                color: 'var(--text-muted)'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Building2 size={14} color="var(--primary-brown)" />
                  <strong>{storesCount}</strong> {storesCount === 1 ? 'loja nesta escala' : 'lojas nesta escala'}
                </span>

                <span style={{ 
                  fontSize: '0.72rem', 
                  padding: '0.15rem 0.45rem', 
                  borderRadius: '10px', 
                  background: storesCount > 0 ? 'var(--primary-brown-light)' : '#F3F4F6',
                  color: storesCount > 0 ? 'var(--primary-brown)' : '#9CA3AF',
                  fontWeight: 700
                }}>
                  {Math.round((storesCount / (stores?.length || 1)) * 100)}% da rede
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredShifts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#FFF', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-subtle)' }}>
          <Calendar size={36} color="var(--text-muted)" style={{ opacity: 0.5, marginBottom: '0.75rem' }} />
          <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Nenhuma escala encontrada</h4>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Tente buscar com outro termo ou cadastre uma nova escala.
          </p>
        </div>
      )}
    </div>
  );
}
