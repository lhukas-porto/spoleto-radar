import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Sparkles,
  Info,
  Layers,
  HelpCircle
} from 'lucide-react';

export default function InternalAreasManager() {
  const { internalAreas, addInternalArea, updateInternalArea, deleteInternalArea } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Edição
  const [editingArea, setEditingArea] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Filtro
  const filteredAreas = (internalAreas || []).filter(area => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (area.name || '').toLowerCase().includes(q) ||
           (area.description || '').toLowerCase().includes(q);
  });

  const handleCreateArea = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    addInternalArea({
      name: newName.trim().toUpperCase(),
      description: newDesc.trim() || 'Área oficial da franqueadora'
    });

    setNewName('');
    setNewDesc('');
    setIsAdding(false);
  };

  const handleStartEdit = (area) => {
    setEditingArea(area);
    setEditName(area.name);
    setEditDesc(area.description || '');
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingArea || !editName.trim()) return;

    updateInternalArea(editingArea.id, {
      name: editName.trim().toUpperCase(),
      description: editDesc.trim()
    });

    setEditingArea(null);
  };

  const handleDelete = (area) => {
    if (window.confirm(`Tem certeza que deseja remover a área interna "${area.name}"?`)) {
      deleteInternalArea(area.id);
    }
  };

  return (
    <div>
      {/* Header com Ações */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.85rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={22} color="var(--primary-brown)" />
            Áreas Internas da Franqueadora <span className="count-pill count-pill-dark">{internalAreas.length}</span>
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
            Departamentos corporativos Spoleto que podem ser selecionados como responsáveis técnicos nos Planos de Ação.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setIsAdding(!isAdding);
              setEditingArea(null);
            }}
            style={{ fontSize: '0.84rem', padding: '0.45rem 0.95rem', gap: '0.4rem' }}
          >
            {isAdding ? <X size={16} /> : <Plus size={16} />}
            {isAdding ? 'Fechar Formulário' : '+ Nova Área Interna'}
          </button>
        </div>
      </div>

      {/* Formulário de Criação Rápida */}
      {isAdding && (
        <form
          onSubmit={handleCreateArea}
          style={{
            backgroundColor: '#FAF8F5',
            border: '1.5px solid var(--accent-gold)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
            <Sparkles size={18} color="var(--primary-brown)" />
            <strong style={{ fontSize: '0.92rem', color: 'var(--primary-brown)' }}>
              Cadastrar Nova Área Corporativa
            </strong>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                Nome da Área Interna *
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Ex: AUDITORIA INTERNA & CONTROLES"
                value={newName}
                onChange={(e) => setNewName(e.target.value.toUpperCase())}
                required
                style={{ width: '100%', fontSize: '0.85rem', fontWeight: 600 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                Descrição do Escopo / Atuação
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Ex: Fiscalização de processos, conformidade com o manual e inventários"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                style={{ width: '100%', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsAdding(false)}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ fontSize: '0.8rem', padding: '0.35rem 1.1rem' }}
            >
              Salvar Área Interna
            </button>
          </div>
        </form>
      )}

      {/* Barra de Pesquisa */}
      <div style={{ position: 'relative', marginBottom: '1.25rem', maxWidth: '460px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="input-field"
          placeholder="Pesquisar por nome ou escopo da área..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', paddingLeft: '2.4rem', fontSize: '0.85rem' }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Grid de Cartões de Áreas Internas */}
      {filteredAreas.length === 0 ? (
        <div style={{ padding: '3rem 1rem', textAlign: 'center', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-subtle)' }}>
          <Building2 size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
          <h4 style={{ fontSize: '1rem', color: 'var(--text-main)', margin: '0 0 0.25rem' }}>Nenhuma área interna encontrada</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Tente buscar por outro termo ou cadastre uma nova área pelo botão acima.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {filteredAreas.map((area) => {
            const isEditingThis = editingArea?.id === area.id;

            if (isEditingThis) {
              return (
                <form
                  key={area.id}
                  onSubmit={handleSaveEdit}
                  style={{
                    background: '#FFFDF9',
                    border: '2px solid var(--accent-gold)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--primary-brown)' }}>Editar Área</strong>
                    <button type="button" onClick={() => setEditingArea(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <X size={14} />
                    </button>
                  </div>

                  <input
                    type="text"
                    className="input-field"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value.toUpperCase())}
                    required
                    style={{ width: '100%', fontSize: '0.82rem', fontWeight: 700 }}
                  />

                  <textarea
                    rows={2}
                    className="input-field"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Descrição do escopo da área..."
                    style={{ width: '100%', fontSize: '0.78rem', resize: 'vertical' }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setEditingArea(null)}
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.85rem' }}
                    >
                      Salvar
                    </button>
                  </div>
                </form>
              );
            }

            return (
              <div
                key={area.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-gold)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-main)', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Building2 size={16} color="var(--primary-brown)" style={{ flexShrink: 0 }} />
                      <span>{area.name}</span>
                    </h4>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                    {area.description || 'Sem descrição cadastrada.'}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', marginTop: '1rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.6rem' }}>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(area)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.72rem',
                      color: 'var(--primary-brown)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '4px'
                    }}
                    title="Editar área"
                  >
                    <Edit2 size={13} /> Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(area)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.72rem',
                      color: '#DC2626',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '4px'
                    }}
                    title="Excluir área"
                  >
                    <Trash2 size={13} /> Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
