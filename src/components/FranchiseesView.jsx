import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatPhoneNumber } from '../utils/dateHelpers';
import { 
  Users, 
  Store, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  Building2, 
  ExternalLink,
  MessageCircle,
  Award,
  Sparkles
} from 'lucide-react';

export default function FranchiseesView() {
  const { 
    franchisees, 
    stores, 
    addFranchisee, 
    updateFranchisee, 
    deleteFranchisee, 
    setSelectedStoreForProfile 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFranchisee, setEditingFranchisee] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    assignedStoreIds: []
  });

  const [storeSearch, setStoreSearch] = useState('');

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingFranchisee(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      assignedStoreIds: []
    });
    setStoreSearch('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (fran) => {
    setEditingFranchisee(fran);
    setFormData({
      name: fran.name || '',
      email: fran.email || '',
      phone: fran.phone || '',
      assignedStoreIds: fran.assignedStoreIds || []
    });
    setStoreSearch('');
    setIsModalOpen(true);
  };

  // Toggle Store Selection
  const toggleStore = (storeId) => {
    setFormData(prev => {
      const exists = prev.assignedStoreIds.includes(storeId);
      if (exists) {
        return { ...prev, assignedStoreIds: prev.assignedStoreIds.filter(id => id !== storeId) };
      } else {
        return { ...prev, assignedStoreIds: [...prev.assignedStoreIds, storeId] };
      }
    });
  };

  // Select All / Deselect All Filtered Stores
  const handleSelectAllFiltered = (filteredStores) => {
    const ids = filteredStores.map(s => s.id);
    const allSelected = ids.every(id => formData.assignedStoreIds.includes(id));
    if (allSelected) {
      setFormData(prev => ({
        ...prev,
        assignedStoreIds: prev.assignedStoreIds.filter(id => !ids.includes(id))
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        assignedStoreIds: Array.from(new Set([...prev.assignedStoreIds, ...ids]))
      }));
    }
  };

  // Submit Form
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingFranchisee) {
      updateFranchisee(editingFranchisee.id, formData);
    } else {
      addFranchisee(formData);
    }
    setIsModalOpen(false);
  };

  // Filter Franchisees
  const filteredFranchisees = franchisees.filter(f => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    const cleanDigits = q.replace(/\D/g, '');

    const matchesFran = 
      f.name.toLowerCase().includes(q) ||
      (f.email || '').toLowerCase().includes(q) ||
      (cleanDigits && (f.phone || '').replace(/\D/g, '').includes(cleanDigits));

    if (matchesFran) return true;

    // Check if any of his stores match
    const hisStores = stores.filter(s => (f.assignedStoreIds || []).includes(s.id));
    return hisStores.some(s => 
      (s.name || '').toLowerCase().includes(q) ||
      (s.code || '').toLowerCase().includes(q) ||
      (s.city || '').toLowerCase().includes(q) ||
      (s.state || '').toLowerCase().includes(q)
    );
  });

  // KPI Calculations
  const totalFranchisees = franchisees.length;
  const multiUnitCount = franchisees.filter(f => (f.assignedStoreIds || []).length > 1).length;
  const totalAssignedStores = new Set(franchisees.flatMap(f => f.assignedStoreIds || [])).size;

  // Filtered stores in modal selection
  const modalFilteredStores = stores.filter(s => {
    const q = storeSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.state.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Header com Ações e KPIs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={24} color="var(--primary-brown)" /> Franqueados & Gestão de Unidades
          </h1>
          <p className="section-subtitle">
            Cadastro oficial de franqueados, múltiplos restaurantes vinculados e canais de disparo para a régua de prazos.
          </p>
        </div>

        <button className="btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Cadastrar Novo Franqueado
        </button>
      </div>

      {/* Mini KPIs de Franqueados */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: 'var(--primary-brown-light)', color: 'var(--primary-brown)' }}>
            <Users size={22} />
          </div>
          <div>
            <div className="kpi-label">Franqueados Cadastrados</div>
            <div className="kpi-value">{totalFranchisees}</div>
            <div className="kpi-subtext">Parceiros de negócios da rede</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: 'var(--info-light)', color: 'var(--info)' }}>
            <Store size={22} />
          </div>
          <div>
            <div className="kpi-label">Lojas Atribuídas</div>
            <div className="kpi-value">{totalAssignedStores} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ {stores.length}</span></div>
            <div className="kpi-subtext">Restaurantes com titular direto</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: 'var(--accent-gold-light)', color: 'var(--accent-gold-dark)' }}>
            <Award size={22} />
          </div>
          <div>
            <div className="kpi-label">Franqueados Multi-Lojas</div>
            <div className="kpi-value">{multiUnitCount}</div>
            <div className="kpi-subtext">Operadores com 2 ou mais unidades</div>
          </div>
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <div className="search-bar" style={{ marginBottom: '1.5rem' }}>
        <Search size={18} style={{ color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          placeholder="Buscar franqueado por nome, e-mail, celular ou nome/código de loja..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button 
            type="button"
            onClick={() => setSearchTerm('')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Grid de Cards de Franqueados */}
      {filteredFranchisees.length === 0 ? (
        <div style={{ padding: '3rem 1rem', textAlign: 'center', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <Users size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: '0.5rem 0' }}>Nenhum franqueado encontrado</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tente alterar o termo de busca ou cadastre um novo franqueado.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {filteredFranchisees.map(fran => {
            const franStores = stores.filter(s => (fran.assignedStoreIds || []).includes(s.id));
            const isMultiUnit = franStores.length > 1;
            const cleanPhone = (fran.phone || '').replace(/\D/g, '');

            return (
              <div 
                key={fran.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  border: isMultiUnit ? '1.5px solid var(--primary-brown-light)' : '1px solid var(--border-subtle)',
                  padding: '1.35rem',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}
              >
                <div>
                  {/* Topo do Card */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: isMultiUnit ? 'linear-gradient(135deg, #5D3826 0%, #B45309 100%)' : '#FAF8F5',
                        border: '1.5px solid var(--border-subtle)',
                        color: isMultiUnit ? '#FFFFFF' : 'var(--primary-brown)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.05rem',
                        flexShrink: 0
                      }}>
                        {fran.name.charAt(0)}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', margin: 0, fontWeight: 800 }}>
                          {fran.name}
                        </h3>
                        <span style={{ fontSize: '0.74rem', color: isMultiUnit ? '#B45309' : 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                          {isMultiUnit && <Sparkles size={11} color="#B45309" />}
                          {franStores.length} {franStores.length === 1 ? 'Loja sob gestão' : 'Lojas sob gestão'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(fran)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem', borderRadius: '4px' }}
                        title="Editar Franqueado"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Deseja remover o franqueado "${fran.name}"?`)) {
                            deleteFranchisee(fran.id);
                          }
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '0.3rem', borderRadius: '4px' }}
                        title="Excluir Franqueado"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Contatos Oficiais */}
                  <div style={{ background: '#FAF8F5', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {/* Email */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
                      <Mail size={13} color="var(--primary-brown)" />
                      {fran.email ? (
                        <a 
                          href={`mailto:${fran.email}`}
                          style={{ color: 'var(--primary-brown)', textDecoration: 'underline', fontWeight: 600, wordBreak: 'break-all' }}
                          title="Enviar e-mail direto para o Franqueado"
                        >
                          {fran.email}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>E-mail não cadastrado</span>
                      )}
                    </div>

                    {/* WhatsApp */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
                      <Phone size={13} color="#166534" />
                      {cleanPhone ? (
                        <a 
                          href={`https://wa.me/55${cleanPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#166534', textDecoration: 'underline', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          title="Conversar com o Franqueado no WhatsApp"
                        >
                          {fran.phone} <MessageCircle size={11} />
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Celular não cadastrado</span>
                      )}
                    </div>
                  </div>

                  {/* Lojas Atribuídas */}
                  <div>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Restaurantes Vinculados ({franStores.length}):
                    </div>
                    {franStores.length === 0 ? (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Nenhuma loja vinculada. Clique em editar para adicionar.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxHeight: '130px', overflowY: 'auto' }}>
                        {franStores.map(st => (
                          <span
                            key={st.id}
                            onClick={() => setSelectedStoreForProfile(st)}
                            style={{
                              fontSize: '0.72rem',
                              background: '#FFFFFF',
                              border: '1px solid var(--border-subtle)',
                              padding: '0.25rem 0.55rem',
                              borderRadius: 'var(--radius-full)',
                              color: 'var(--primary-brown)',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--primary-brown)';
                              e.currentTarget.style.background = '#FAF8F5';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border-subtle)';
                              e.currentTarget.style.background = '#FFFFFF';
                            }}
                            title="Clique para abrir a Ficha 360° da Loja"
                          >
                            <Building2 size={11} />
                            <strong>{st.code}</strong> &bull; {st.name.replace('SPOLETO', '').trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Botão de Edição Rápida */}
                <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleOpenEdit(fran)}
                    style={{ width: '100%', fontSize: '0.78rem', justifyContent: 'center', gap: '0.35rem' }}
                  >
                    <Edit3 size={13} /> Gerenciar Lojas & Contatos
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          MODAL DE CADASTRO / EDIÇÃO DE FRANQUEADO
          ========================================================================= */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px', width: '92vw', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="var(--primary-brown)" />
                {editingFranchisee ? 'Editar Franqueado' : 'Cadastrar Novo Franqueado'}
              </h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
                
                {/* Nome do Franqueado */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                    Nome Completo do Franqueado / Grupo Empresarial *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="EX: CARLOS ALBERTO SILVEIRA OU GRUPO ALVORADA"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', textTransform: 'uppercase' }}
                  />
                </div>

                {/* E-mail e WhatsApp em Grid de 2 Colunas */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                      E-mail Principal (Para Régua de Prazos / SLA) *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="franqueado@spoleto.com.br"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase().trim() })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', textTransform: 'lowercase' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                      Celular / WhatsApp com DDD *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="(11) 98765-4321"
                      maxLength={15}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem' }}
                    />
                  </div>
                </div>

                {/* Seleção de Lojas Pertencentes ao Franqueado */}
                <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--primary-brown)' }}>
                        Lojas Pertencentes a este Franqueado ({formData.assignedStoreIds.length} selecionadas):
                      </label>
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0.1rem 0 0' }}>
                        Marque todos os restaurantes sob responsabilidade deste franqueado.
                      </p>
                    </div>

                    {modalFilteredStores.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleSelectAllFiltered(modalFilteredStores)}
                        style={{
                          background: '#FAF8F5',
                          border: '1px solid var(--border-subtle)',
                          padding: '0.25rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: 'var(--primary-brown)',
                          cursor: 'pointer'
                        }}
                      >
                        {modalFilteredStores.every(s => formData.assignedStoreIds.includes(s.id)) ? 'Desmarcar Listadas' : 'Marcar Listadas'}
                      </button>
                    )}
                  </div>

                  {/* Campo de Busca Rápida de Lojas */}
                  <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Filtrar lojas por nome, código RP ou cidade..."
                      value={storeSearch}
                      onChange={(e) => setStoreSearch(e.target.value)}
                      style={{ paddingLeft: '2rem', paddingRight: '1rem', width: '100%', fontSize: '0.82rem', padding: '0.45rem 2rem' }}
                    />
                  </div>

                  {/* Lista com Checkboxes */}
                  <div style={{
                    maxHeight: '260px',
                    overflowY: 'auto',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.65rem',
                    background: '#FAF8F5',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem'
                  }}>
                    {modalFilteredStores.length === 0 ? (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        Nenhuma loja encontrada com o termo "{storeSearch}".
                      </div>
                    ) : (
                      modalFilteredStores.map(st => {
                        const isChecked = formData.assignedStoreIds.includes(st.id);
                        return (
                          <div
                            key={st.id}
                            onClick={() => toggleStore(st.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.75rem',
                              padding: '0.55rem 0.85rem',
                              borderRadius: 'var(--radius-sm)',
                              background: isChecked ? '#FEF3C7' : '#FFFFFF',
                              border: isChecked ? '1.5px solid #F59E0B' : '1px solid var(--border-subtle)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              boxShadow: isChecked ? '0 2px 6px rgba(245, 158, 11, 0.15)' : 'none'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}} // handled by parent onClick
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  minWidth: '18px',
                                  minHeight: '18px',
                                  margin: 0,
                                  cursor: 'pointer',
                                  accentColor: 'var(--primary-brown)'
                                }}
                              />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                                  <span style={{
                                    fontSize: '0.74rem',
                                    fontWeight: 800,
                                    background: isChecked ? '#B45309' : 'var(--primary-brown-light)',
                                    color: isChecked ? '#FFFFFF' : 'var(--primary-brown)',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '4px',
                                    letterSpacing: '0.3px'
                                  }}>
                                    {st.code}
                                  </span>
                                  <span style={{ fontSize: '0.84rem', fontWeight: isChecked ? 800 : 600, color: isChecked ? '#92400E' : 'var(--text-main)' }}>
                                    {st.name.replace('SPOLETO', '').trim()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div style={{ fontSize: '0.74rem', color: isChecked ? '#92400E' : 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: 600 }}>
                              📍 {st.city}/{st.state}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

              {/* Botões do Modal */}
              <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={16} /> {editingFranchisee ? 'Salvar Alterações' : 'Cadastrar Franqueado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
