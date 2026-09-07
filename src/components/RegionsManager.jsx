import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  MapPin, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Sparkles,
  Building2,
  Users,
  AlertCircle
} from 'lucide-react';

export default function RegionsManager() {
  const { 
    regions = [], 
    addRegion, 
    updateRegion, 
    deleteRegion, 
    visibleConsultants: consultants = [],
    isAdminUnlocked,
    hasPermission 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newRegionInput, setNewRegionInput] = useState('');

  // Edição
  const [editingRegionOldName, setEditingRegionOldName] = useState(null);
  const [editingRegionNewName, setEditingRegionNewName] = useState('');

  // Permissão de gerenciamento
  const canManage = isAdminUnlocked || hasPermission('settings_regions');

  // Filtro
  const filteredRegions = regions.filter(region => 
    region.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleAddNewRegion = (e) => {
    e.preventDefault();
    if (!newRegionInput.trim()) return;
    const ok = addRegion(newRegionInput.trim());
    if (ok) {
      setNewRegionInput('');
      setIsAdding(false);
    }
  };

  const handleStartEdit = (regionName) => {
    setEditingRegionOldName(regionName);
    setEditingRegionNewName(regionName);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingRegionNewName.trim()) return;
    updateRegion(editingRegionOldName, editingRegionNewName.trim());
    setEditingRegionOldName(null);
    setEditingRegionNewName('');
  };

  const handleDelete = (regionName) => {
    const consultantsUsing = consultants.filter(c => c.region === regionName);
    if (consultantsUsing.length > 0) {
      alert(`Não é possível excluir a região "${regionName}" porque existem ${consultantsUsing.length} membro(s) da equipe alocados nela. Realoque-os primeiro.`);
      return;
    }

    if (window.confirm(`Tem certeza que deseja remover a região "${regionName}" da base oficial?`)) {
      deleteRegion(regionName);
    }
  };

  return (
    <div>
      {/* Header com Ações */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.85rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-brown)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <MapPin size={22} color="var(--accent-gold)" />
            Regiões & Polos Operacionais da Rede
          </h2>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Defina as divisões territoriais oficiais da Spoleto para alocação de Gerências e Consultores de Negócios ({regions.length} polos cadastrados).
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setIsAdding(!isAdding);
              setEditingRegionOldName(null);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', fontSize: '0.86rem' }}
          >
            {isAdding ? <X size={16} /> : <Plus size={16} />}
            {isAdding ? 'Cancelar' : 'Nova Região'}
          </button>
        )}
      </div>

      {/* Alerta de Modo Somente Leitura caso sem permissão */}
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
            <strong>Modo Somente Leitura:</strong> As regiões podem ser consultadas, mas apenas perfis autorizados pelo Administrador Master podem adicionar, renomear ou excluir regiões.
          </span>
        </div>
      )}

      {/* Formulário de Criação Rápida */}
      {isAdding && canManage && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: '#FAFAFA', border: '2px solid var(--accent-gold)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontWeight: 800, color: 'var(--primary-brown)', fontSize: '0.95rem' }}>
            <Sparkles size={18} color="var(--accent-gold)" />
            Cadastrar Novo Polo Regional
          </div>

          <form onSubmit={handleAddNewRegion}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                value={newRegionInput} 
                onChange={(e) => setNewRegionInput(e.target.value)} 
                placeholder="Ex: Rio de Janeiro (Capital & Baixada)..."
                required
                style={{ flex: 1, minWidth: '260px' }}
                autoFocus
              />
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
                Salvar Região
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
            placeholder="Buscar região ou estado..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.25rem', fontSize: '0.86rem' }}
          />
        </div>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {filteredRegions.length} {filteredRegions.length === 1 ? 'região encontrada' : 'regiões encontradas'}
        </span>
      </div>

      {/* Grid de Cards das Regiões */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {filteredRegions.map((regionName) => {
          const consultantsInRegion = consultants.filter(c => c.region === regionName);
          const count = consultantsInRegion.length;
          const isEditingThis = editingRegionOldName === regionName;

          if (isEditingThis) {
            return (
              <div key={regionName} className="card" style={{ padding: '1rem', border: '2px solid var(--primary-brown)', background: '#FAFAFA' }}>
                <form onSubmit={handleSaveEdit}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-brown)', textTransform: 'uppercase' }}>
                      Renomear Região
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setEditingRegionOldName(null)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <input 
                    type="text" 
                    value={editingRegionNewName} 
                    onChange={(e) => setEditingRegionNewName(e.target.value)} 
                    required
                    style={{ width: '100%', fontSize: '0.88rem', marginBottom: '0.75rem' }}
                    autoFocus
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setEditingRegionOldName(null)}
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
              key={regionName} 
              className="card" 
              style={{ 
                padding: '1.15rem', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{ 
                    fontSize: '0.92rem', 
                    fontWeight: 800, 
                    color: 'var(--text-main)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.45rem' 
                  }}>
                    <MapPin size={16} color="var(--primary-brown)" style={{ flexShrink: 0 }} />
                    {regionName}
                  </span>

                  {canManage && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(regionName)}
                        title="Renomear região"
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
                        <Edit3 size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(regionName)}
                        title="Excluir região"
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '0.35rem',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          color: count > 0 ? '#CBD5E1' : '#EF4444'
                        }}
                        disabled={count > 0}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé do Card com Quantidade de Colaboradores Atrelados */}
              <div style={{
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '0.65rem',
                marginTop: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
                color: 'var(--text-muted)'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Users size={14} color="var(--primary-brown)" />
                  <strong>{count}</strong> {count === 1 ? 'colaborador alocado' : 'colaboradores alocados'}
                </span>

                <span style={{ 
                  fontSize: '0.72rem', 
                  padding: '0.15rem 0.45rem', 
                  borderRadius: '10px', 
                  background: count > 0 ? 'var(--primary-brown-light)' : '#F3F4F6',
                  color: count > 0 ? 'var(--primary-brown)' : '#9CA3AF',
                  fontWeight: 700
                }}>
                  {count > 0 ? 'Região Ativa' : 'Sem Equipe'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRegions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#FFF', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-subtle)' }}>
          <MapPin size={36} color="var(--text-muted)" style={{ opacity: 0.5, marginBottom: '0.75rem' }} />
          <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Nenhuma região encontrada</h4>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Tente buscar com outro termo ou cadastre uma nova região.
          </p>
        </div>
      )}
    </div>
  );
}
