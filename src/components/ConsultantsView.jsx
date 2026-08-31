import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  Store, 
  Plus, 
  Calendar,
  X,
  CheckSquare,
  Square,
  Search,
  Check,
  Filter,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react';

export default function ConsultantsView() {
  const { consultants, stores, visits, addConsultant, assignStoresToConsultant, setActiveTab } = useApp();
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [managingConsultant, setManagingConsultant] = useState(null);

  // Store selection state inside assignment modal
  const [assignedStoreIds, setAssignedStoreIds] = useState([]);
  const [storeSearch, setStoreSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('Todos');
  const [availabilityFilter, setAvailabilityFilter] = useState('Todas'); // 'Todas' | 'Deste Consultor' | 'Disponíveis' | 'Outros Consultores'

  // New Consultant state
  const [newCons, setNewCons] = useState({
    name: '',
    email: '',
    phone: '',
    region: 'SP - Capital'
  });

  const handleOpenManageStores = (consultant) => {
    setManagingConsultant(consultant);
    const currentStoreIds = stores.filter(s => 
      s.consultantId === consultant.id || 
      (consultant.assignedStores && Array.isArray(consultant.assignedStores) && consultant.assignedStores.includes(s.id))
    ).map(s => s.id);
    setAssignedStoreIds(currentStoreIds);
    setStoreSearch('');
    setStateFilter('Todos');
    setAvailabilityFilter('Todas');
  };

  const handleToggleStore = (store) => {
    // If the store belongs to another consultant, it cannot be ticked directly
    if (store.consultantId && store.consultantId !== managingConsultant.id && !assignedStoreIds.includes(store.id)) {
      const otherCons = consultants.find(c => c.id === store.consultantId);
      alert(`A loja "${store.name}" já está vinculada ao consultor(a) ${otherCons?.name || 'outro consultor'}. Para adicioná-la aqui, desmarque-a primeiro na carteira dele(a).`);
      return;
    }

    setAssignedStoreIds(prev => {
      if (prev.includes(store.id)) {
        return prev.filter(id => id !== store.id);
      } else {
        return [...prev, store.id];
      }
    });
  };

  // Only select stores that belong to this consultant OR are free (available)
  const handleSelectAllAvailable = (filteredList) => {
    const freeOrMineIds = filteredList
      .filter(s => !s.consultantId || s.consultantId === managingConsultant.id)
      .map(s => s.id);

    setAssignedStoreIds(prev => {
      const combined = new Set([...prev, ...freeOrMineIds]);
      return Array.from(combined);
    });
  };

  const handleDeselectAllMine = (filteredList) => {
    const filteredIds = new Set(filteredList.map(s => s.id));
    setAssignedStoreIds(prev => prev.filter(id => !filteredIds.has(id)));
  };

  const handleSaveAssignedStores = () => {
    if (managingConsultant) {
      assignStoresToConsultant(managingConsultant.id, assignedStoreIds);
      setManagingConsultant(null);
    }
  };

  const handleSaveConsultant = (e) => {
    e.preventDefault();
    if (!newCons.name || !newCons.email) {
      alert('Preencha pelo menos o Nome e E-mail.');
      return;
    }
    addConsultant(newCons);
    setIsAddModalOpen(false);
    setNewCons({
      name: '',
      email: '',
      phone: '',
      region: 'SP - Capital'
    });
  };

  // Filtered stores for the checklist modal
  const modalFilteredStores = stores.filter(store => {
    const q = storeSearch.toLowerCase().trim();
    const matchesQuery = !q || 
      store.name.toLowerCase().includes(q) ||
      store.code.toLowerCase().includes(q) ||
      store.city.toLowerCase().includes(q) ||
      store.state.toLowerCase().includes(q);

    const matchesState = stateFilter === 'Todos' || store.state === stateFilter;

    let matchesAvailability = true;
    if (availabilityFilter === 'Deste Consultor') {
      matchesAvailability = assignedStoreIds.includes(store.id);
    } else if (availabilityFilter === 'Disponíveis') {
      matchesAvailability = !store.consultantId && !assignedStoreIds.includes(store.id);
    } else if (availabilityFilter === 'Outros Consultores') {
      matchesAvailability = store.consultantId && store.consultantId !== managingConsultant?.id && !assignedStoreIds.includes(store.id);
    }

    return matchesQuery && matchesState && matchesAvailability;
  });

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Equipe de Consultores de Negócios</h1>
          <p className="section-subtitle">Gerencie os consultores e defina a carteira exclusiva de lojas Spoleto para cada um.</p>
        </div>

        <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} /> Cadastrar Consultor
        </button>
      </div>

      {/* Grid de Consultores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {consultants.map(consultant => {
          const assignedStores = stores.filter(s => 
            s.consultantId === consultant.id || 
            (consultant.assignedStores && Array.isArray(consultant.assignedStores) && consultant.assignedStores.includes(s.id))
          );
          const storeCount = (consultant.assignedStores && consultant.assignedStores.length > 0) 
            ? consultant.assignedStores.length 
            : assignedStores.length;

          return (
            <div 
              key={consultant.id} 
              className="card-panel"
              style={{
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1.25rem',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--primary-brown-light)',
                      color: 'var(--primary-brown)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.25rem'
                    }}>
                      {consultant.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>
                        {consultant.name}
                      </h3>
                      <div style={{ fontSize: '0.82rem', color: 'var(--primary-brown)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={13} /> {consultant.region}
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.78rem', background: '#F3F4F6', color: '#374151', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                    {storeCount} loja{storeCount !== 1 ? 's' : ''}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={14} color="var(--text-muted)" />
                    {consultant.email}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={14} color="var(--text-muted)" />
                    {consultant.phone}
                  </div>
                </div>

                {/* Box de Lojas Vinculadas */}
                <div style={{ background: 'var(--bg-warm)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Carteira Exclusiva ({storeCount})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenManageStores(consultant)}
                      style={{ color: 'var(--primary-brown)', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'underline' }}
                    >
                      Alterar Lojas
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxHeight: '130px', overflowY: 'auto', paddingRight: '4px' }}>
                    {assignedStores.map(s => (
                      <span 
                        key={s.id} 
                        style={{ 
                          fontSize: '0.74rem', 
                          background: '#FFFFFF', 
                          border: '1px solid var(--border-subtle)', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '4px', 
                          fontWeight: 600,
                          color: 'var(--text-main)'
                        }}
                      >
                        [{s.code}] {s.name.replace(/^SPOLETO\s+/i, '')}
                      </span>
                    ))}
                    {assignedStores.length === 0 && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Nenhuma loja vinculada. Clique abaixo para selecionar da lista de lojas disponíveis.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <button 
                  className="btn-primary"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem', flex: 1, justifyContent: 'center' }}
                  onClick={() => handleOpenManageStores(consultant)}
                >
                  <CheckSquare size={15} /> Alterar Lojas ({storeCount})
                </button>

                <button 
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.8rem' }}
                  onClick={() => setActiveTab('reports')}
                  title="Ver histórico de visitas"
                >
                  <Calendar size={14} /> Relatórios
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          MODAL DE GERENCIAMENTO DE CARTEIRA EXCLUSIVA (COM TRAVA DE UNICIDADE)
          ========================================================================= */}
      {managingConsultant && (
        <div className="modal-overlay" onClick={() => setManagingConsultant(null)}>
          <div 
            className="modal-card" 
            style={{ maxWidth: '880px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--primary-brown)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckSquare size={22} /> Definir Lojas de {managingConsultant.name}
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Regra: Cada loja só pode pertencer a <strong>um consultor</strong>. Desmarque uma loja para liberá-la para outro consultor.
                </p>
              </div>

              <button onClick={() => setManagingConsultant(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={22} />
              </button>
            </div>

            {/* Barra de Filtros, Busca e Abas de Disponibilidade */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', background: '#FAF8F5', padding: '0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text"
                    placeholder="Buscar loja por nome, shopping, código SPO ou cidade..."
                    value={storeSearch}
                    onChange={(e) => setStoreSearch(e.target.value)}
                    style={{ paddingLeft: '2.2rem', width: '100%', fontSize: '0.88rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>UF:</span>
                  {['Todos', 'SP', 'RJ', 'MG', 'BA', 'PE', 'PR', 'DF'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStateFilter(st)}
                      style={{
                        padding: '0.2rem 0.45rem',
                        fontSize: '0.75rem',
                        borderRadius: '4px',
                        background: stateFilter === st ? 'var(--primary-brown)' : '#FFFFFF',
                        color: stateFilter === st ? '#FFFFFF' : 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                        fontWeight: 600
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtro por Disponibilidade */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderTop: '1px solid #EAE5DE', paddingTop: '0.6rem' }}>
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  {[
                    { id: 'Todas', label: 'Todas as Lojas' },
                    { id: 'Deste Consultor', label: `Deste Consultor (${assignedStoreIds.length})` },
                    { id: 'Disponíveis', label: 'Disponíveis (Sem Consultor)' },
                    { id: 'Outros Consultores', label: 'De Outros Consultores' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setAvailabilityFilter(tab.id)}
                      style={{
                        padding: '0.3rem 0.65rem',
                        fontSize: '0.78rem',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--border-subtle)',
                        background: availabilityFilter === tab.id ? 'var(--text-main)' : '#FFFFFF',
                        color: availabilityFilter === tab.id ? '#FFFFFF' : 'var(--text-secondary)',
                        fontWeight: availabilityFilter === tab.id ? 700 : 500
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Ações Rápidas */}
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.78rem' }}>
                  <button 
                    type="button"
                    onClick={() => handleSelectAllAvailable(modalFilteredStores)}
                    style={{ color: 'var(--info)', fontWeight: 600, textDecoration: 'underline' }}
                    title="Marca apenas lojas que estão disponíveis ou já pertencem a este consultor"
                  >
                    Marcar Disponíveis Filtradas
                  </button>
                  &bull;
                  <button 
                    type="button"
                    onClick={() => handleDeselectAllMine(modalFilteredStores)}
                    style={{ color: 'var(--danger)', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    Desmarcar Deste Consultor
                  </button>
                </div>
              </div>
            </div>

            {/* Lista com Checkboxes Interativos e Bloqueio Visual para Outros Consultores */}
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', background: '#FFFFFF', padding: '0.65rem' }}>
              {modalFilteredStores.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Nenhuma loja encontrada para os filtros selecionados.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0.5rem' }}>
                  {modalFilteredStores.map(store => {
                    const isChecked = assignedStoreIds.includes(store.id);
                    const isAssignedToOther = store.consultantId && store.consultantId !== managingConsultant.id && !isChecked;
                    const otherConsultant = isAssignedToOther ? consultants.find(c => c.id === store.consultantId) : null;

                    return (
                      <div 
                        key={store.id}
                        onClick={() => handleToggleStore(store)}
                        style={{
                          border: isChecked ? '2px solid var(--primary-brown)' : isAssignedToOther ? '1px dashed #CBD5E1' : '1px solid var(--border-subtle)',
                          backgroundColor: isChecked ? 'var(--primary-brown-light)' : isAssignedToOther ? '#F8FAFC' : '#FFFFFF',
                          opacity: isAssignedToOther ? 0.75 : 1,
                          padding: '0.65rem 0.85rem',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          cursor: isAssignedToOther ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        title={isAssignedToOther ? `Esta loja está vinculada ao consultor(a) ${otherConsultant?.name}. Desmarque-a na carteira dele(a) para liberar.` : isChecked ? 'Clique para desmarcar e liberar esta loja' : 'Clique para vincular a este consultor'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
                          {/* Caixa de Seleção / Ícone de Cadeado */}
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            border: isChecked ? 'none' : isAssignedToOther ? '1px solid #94A3B8' : '2px solid var(--border-strong)',
                            background: isChecked ? 'var(--primary-brown)' : isAssignedToOther ? '#E2E8F0' : '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            flexShrink: 0
                          }}>
                            {isChecked && <Check size={15} />}
                            {isAssignedToOther && <Lock size={12} color="#64748B" />}
                          </div>

                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: isChecked ? 700 : 600, color: isChecked ? 'var(--primary-brown)' : isAssignedToOther ? '#64748B' : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              [{store.code}] {store.name.replace(/^SPOLETO\s+/i, '')}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              {store.city}/{store.state} &bull; {store.locationType}
                            </div>
                          </div>
                        </div>

                        {/* Status da Loja */}
                        <div>
                          {isChecked && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--primary-brown)', fontWeight: 700, background: '#FFFFFF', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid var(--primary-brown)' }}>
                              Deste Consultor
                            </span>
                          )}
                          {isAssignedToOther && (
                            <span style={{ fontSize: '0.68rem', color: '#64748B', background: '#E2E8F0', padding: '0.15rem 0.45rem', borderRadius: '4px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Lock size={10} /> {otherConsultant?.name.split(' ')[0]}
                            </span>
                          )}
                          {!isChecked && !isAssignedToOther && (
                            <span style={{ fontSize: '0.68rem', color: 'var(--success)', background: 'var(--success-light)', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Unlock size={10} /> Disponível
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer com Salvar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Carteira selecionada: <strong style={{ color: 'var(--primary-brown)' }}>{assignedStoreIds.length} lojas</strong> para <strong>{managingConsultant.name}</strong>
              </span>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setManagingConsultant(null)}>
                  Cancelar
                </button>
                <button type="button" className="btn-primary" onClick={handleSaveAssignedStores}>
                  <CheckCircle2 size={16} /> Salvar Carteira
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastro de Consultor */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--primary-brown)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={22} /> Cadastrar Consultor de Negócios
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveConsultant}>
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Nome Completo *</label>
                  <input 
                    type="text" 
                    value={newCons.name} 
                    onChange={(e) => setNewCons({ ...newCons, name: e.target.value })} 
                    placeholder="Nome do consultor(a)" 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">E-mail Corporativo *</label>
                  <input 
                    type="email" 
                    value={newCons.email} 
                    onChange={(e) => setNewCons({ ...newCons, email: e.target.value })} 
                    placeholder="nome@grupotrigo.com.br" 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Telefone / WhatsApp</label>
                  <input 
                    type="text" 
                    value={newCons.phone} 
                    onChange={(e) => setNewCons({ ...newCons, phone: e.target.value })} 
                    placeholder="(11) 99999-9999" 
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Região de Atuação</label>
                  <input 
                    type="text" 
                    value={newCons.region} 
                    onChange={(e) => setNewCons({ ...newCons, region: e.target.value })} 
                    placeholder="Ex: RJ - Zona Norte & Baixada" 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar Consultor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
