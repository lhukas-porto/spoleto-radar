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
  AlertCircle,
  Edit3,
  Trash2
} from 'lucide-react';

const OFFICIAL_REGIONS = [
  "SP Capital, Campinas & Região",
  "SP Capital, ABC, Litoral & Vale",
  "SP Capital, Osasco, Alto Tietê & Interior",
  "SP Capital, Campinas & Piracicaba",
  "SP Capital, Campinas & Interior",
  "SP Interior & Sul de Minas",
  "RJ Capital & Sul Fluminense",
  "RJ Capital, Serrana, Lagos & Norte",
  "RJ Capital & Espírito Santo",
  "Minas Gerais (BH & Interior)",
  "Região Sul (PR, SC, RS)",
  "Nordeste (PB, PE, AL, BA, RN)",
  "Nordeste (CE, BA)",
  "Norte & Nordeste (AM, PA, AP, RR, RO, MA, PI)",
  "Centro-Oeste (DF, GO, MT, MS, TO)",
  "DF, GO, MT, AC & BA",
  "SP - Capital",
  "SP - Interior",
  "RJ - Capital",
  "Sul - Geral",
  "Nacional / Brasil"
];

export default function ConsultantsView() {
  const { 
    consultants, 
    stores, 
    visits, 
    addConsultant, 
    updateConsultant, 
    deleteConsultant, 
    assignStoresToConsultant, 
    regions,
    addRegion,
    updateRegion,
    deleteRegion,
    setActiveTab 
  } = useApp();

  // Combine regions from context with any active consultants' custom regions
  const availableRegions = Array.from(new Set([
    ...(regions || []),
    ...consultants.map(c => c.region).filter(Boolean)
  ]));
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [managingConsultant, setManagingConsultant] = useState(null);
  const [editingConsultant, setEditingConsultant] = useState(null);
  const [isRegionsModalOpen, setIsRegionsModalOpen] = useState(false);

  // Region Management state
  const [newRegionInput, setNewRegionInput] = useState('');
  const [editingRegionOldName, setEditingRegionOldName] = useState(null);
  const [editingRegionNewName, setEditingRegionNewName] = useState('');
  const [regionSearchTerm, setRegionSearchTerm] = useState('');

  // Edit Consultant Form State
  const [editForm, setEditForm] = useState({
    name: '',
    region: availableRegions[0] || 'SP - Capital',
    email: '',
    phone: ''
  });

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
    region: availableRegions[0] || 'SP - Capital'
  });

  // Region Management Handlers
  const handleAddNewRegion = (e) => {
    e.preventDefault();
    if (!newRegionInput.trim()) return;
    const ok = addRegion(newRegionInput.trim());
    if (ok) setNewRegionInput('');
  };

  const handleStartEditRegion = (regionName) => {
    setEditingRegionOldName(regionName);
    setEditingRegionNewName(regionName);
  };

  const handleSaveEditRegion = (e) => {
    e.preventDefault();
    if (!editingRegionNewName.trim()) return;
    updateRegion(editingRegionOldName, editingRegionNewName.trim());
    setEditingRegionOldName(null);
    setEditingRegionNewName('');
  };

  const handleDeleteRegion = (regionName) => {
    const consultantsUsing = consultants.filter(c => c.region === regionName);
    const msg = consultantsUsing.length > 0
      ? `Atenção: existem ${consultantsUsing.length} consultor(es) vinculados a esta região (${consultantsUsing.map(c => c.name).join(', ')}). Deseja realmente excluir a região "${regionName}"?`
      : `Tem certeza que deseja excluir a região "${regionName}"?`;

    if (confirm(msg)) {
      deleteRegion(regionName);
    }
  };

  const handleOpenEditModal = (consultant) => {
    setEditingConsultant(consultant);
    setEditForm({
      name: consultant.name || '',
      region: consultant.region || availableRegions[0] || '',
      email: consultant.email || '',
      phone: consultant.phone || ''
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      alert('Preencha pelo menos o Nome do consultor.');
      return;
    }
    updateConsultant(editingConsultant.id, editForm);
    setEditingConsultant(null);
  };

  const handleDeleteConsultant = (consultant) => {
    if (confirm(`Tem certeza que deseja excluir o consultor "${consultant.name}"? As lojas vinculadas a ele ficarão com status "Não atribuído".`)) {
      deleteConsultant(consultant.id);
      setEditingConsultant(null);
    }
  };

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
    if (!newCons.name.trim()) {
      alert('Preencha pelo menos o Nome do Consultor.');
      return;
    }
    addConsultant(newCons);
    setIsAddModalOpen(false);
    setNewCons({
      name: '',
      email: '',
      phone: '',
      region: availableRegions[0] || 'SP - Capital'
    });
  };

  // Filtered regions for management modal
  const filteredRegionsList = availableRegions.filter(reg => 
    reg.toLowerCase().includes(regionSearchTerm.toLowerCase())
  );

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
          <p className="section-subtitle">Gerencie os consultores, regiões de atendimento e defina a carteira exclusiva de lojas Spoleto.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => setIsRegionsModalOpen(true)}>
            <MapPin size={18} /> Gerenciar Regiões ({availableRegions.length})
          </button>
          <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} /> Cadastrar Consultor
          </button>
        </div>
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

                {(consultant.email || consultant.phone) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    {consultant.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={14} color="var(--text-muted)" />
                        {consultant.email}
                      </div>
                    )}
                    {consultant.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Phone size={14} color="var(--text-muted)" />
                        {consultant.phone}
                      </div>
                    )}
                  </div>
                ) : null}

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
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.8rem', flex: 1, justifyContent: 'center' }}
                  onClick={() => handleOpenManageStores(consultant)}
                >
                  <CheckSquare size={15} /> Lojas ({storeCount})
                </button>

                <button 
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  onClick={() => handleOpenEditModal(consultant)}
                  title="Editar dados cadastrais do consultor"
                >
                  <Edit3 size={14} /> Editar
                </button>

                <button 
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
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
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
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
                    placeholder="Ex: CARLOS SILVA" 
                    required 
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Região / Praça de Atuação *</label>
                    <button 
                      type="button" 
                      onClick={() => setIsRegionsModalOpen(true)}
                      style={{ fontSize: '0.75rem', color: 'var(--primary-brown)', background: 'transparent', border: 'none', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                      <Plus size={12} /> Gerenciar / Criar Praças
                    </button>
                  </div>
                  <select 
                    value={newCons.region} 
                    onChange={(e) => setNewCons({ ...newCons, region: e.target.value })} 
                    required
                  >
                    {availableRegions.map(reg => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>
                  <span className="form-help">Selecione a região ou praça oficial de atendimento</span>
                </div>

                <div className="form-group">
                  <label className="form-label">E-mail (Opcional)</label>
                  <input 
                    type="email" 
                    value={newCons.email} 
                    onChange={(e) => setNewCons({ ...newCons, email: e.target.value })} 
                    placeholder="nome@grupotrigo.com.br" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Telefone / WhatsApp (Opcional)</label>
                  <input 
                    type="text" 
                    value={newCons.phone} 
                    onChange={(e) => setNewCons({ ...newCons, phone: e.target.value })} 
                    placeholder="(11) 99999-9999" 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <CheckCircle2 size={16} /> Salvar Consultor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edição de Consultor */}
      {editingConsultant && (
        <div className="modal-overlay" onClick={() => setEditingConsultant(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--primary-brown)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 size={20} /> Editar Consultor: {editingConsultant.name}
              </h2>
              <button onClick={() => setEditingConsultant(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Nome Completo *</label>
                  <input 
                    type="text" 
                    value={editForm.name} 
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} 
                    placeholder="Nome do consultor(a)" 
                    required 
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Região / Praça de Atuação *</label>
                    <button 
                      type="button" 
                      onClick={() => setIsRegionsModalOpen(true)}
                      style={{ fontSize: '0.75rem', color: 'var(--primary-brown)', background: 'transparent', border: 'none', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                      <Plus size={12} /> Gerenciar / Criar Praças
                    </button>
                  </div>
                  <select 
                    value={editForm.region} 
                    onChange={(e) => setEditForm({ ...editForm, region: e.target.value })} 
                    required
                  >
                    {availableRegions.map(reg => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>
                  <span className="form-help">Selecione a região ou praça oficial de atendimento</span>
                </div>

                <div className="form-group">
                  <label className="form-label">E-mail (Opcional)</label>
                  <input 
                    type="email" 
                    value={editForm.email} 
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} 
                    placeholder="nome@grupotrigo.com.br" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Telefone / WhatsApp (Opcional)</label>
                  <input 
                    type="text" 
                    value={editForm.phone} 
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} 
                    placeholder="(DDD) 99999-9999" 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <button 
                  type="button" 
                  style={{ background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5', padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                  onClick={() => handleDeleteConsultant(editingConsultant)}
                >
                  <Trash2 size={14} /> Excluir Consultor
                </button>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setEditingConsultant(null)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    <CheckCircle2 size={16} /> Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Gerenciador de Regiões / Praças */}
      {isRegionsModalOpen && (
        <div className="modal-overlay" onClick={() => { setIsRegionsModalOpen(false); setEditingRegionOldName(null); }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--primary-brown)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={22} /> Gerenciar Regiões e Praças de Atuação
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.2rem' }}>
                  Adicione novas praças, renomeie ou exclua regiões do catálogo oficial.
                </p>
              </div>
              <button onClick={() => { setIsRegionsModalOpen(false); setEditingRegionOldName(null); }} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Form de Adicionar Nova Região */}
            <form onSubmit={handleAddNewRegion} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: 'var(--bg-warm)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <input 
                type="text" 
                value={newRegionInput} 
                onChange={(e) => setNewRegionInput(e.target.value)} 
                placeholder="Nome da nova região / praça (ex: SP - Vale do Paraíba & Litoral)"
                style={{ flex: 1, padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
              />
              <button type="submit" className="btn-primary" style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                <Plus size={16} /> Adicionar
              </button>
            </form>

            {/* Busca de Regiões */}
            <div style={{ position: 'relative', marginBottom: '0.85rem' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text"
                placeholder="Filtrar regiões na lista..."
                value={regionSearchTerm}
                onChange={(e) => setRegionSearchTerm(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.3rem', fontSize: '0.82rem', paddingBlock: '0.45rem' }}
              />
            </div>

            {/* Lista de Regiões */}
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', maxHeight: '380px' }}>
              {filteredRegionsList.map((regionName, idx) => {
                const count = consultants.filter(c => c.region === regionName).length;
                const isEditing = editingRegionOldName === regionName;

                return (
                  <div 
                    key={regionName + idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderBottom: '1px solid var(--border-subtle)',
                      background: isEditing ? 'var(--primary-brown-light)' : '#FFFFFF',
                      gap: '0.5rem'
                    }}
                  >
                    {isEditing ? (
                      <form onSubmit={handleSaveEditRegion} style={{ display: 'flex', gap: '0.5rem', flex: 1, alignItems: 'center' }}>
                        <input 
                          type="text" 
                          value={editingRegionNewName} 
                          onChange={(e) => setEditingRegionNewName(e.target.value)} 
                          autoFocus
                          style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.85rem', fontWeight: 600 }}
                        />
                        <button type="submit" className="btn-primary" style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem' }} title="Salvar alteração">
                          <Check size={14} /> Salvar
                        </button>
                        <button type="button" className="btn-secondary" style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem' }} onClick={() => setEditingRegionOldName(null)} title="Cancelar">
                          <X size={14} />
                        </button>
                      </form>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
                          <MapPin size={14} color="var(--primary-brown)" />
                          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {regionName}
                          </span>
                          <span style={{ fontSize: '0.72rem', background: '#F3F4F6', color: '#4B5563', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
                            {count} consultor{count !== 1 ? 'es' : ''}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button 
                            type="button" 
                            className="btn-secondary" 
                            style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem' }}
                            onClick={() => handleStartEditRegion(regionName)}
                            title="Renomear região"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button 
                            type="button" 
                            style={{ background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5', padding: '0.35rem 0.55rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            onClick={() => handleDeleteRegion(regionName)}
                            title="Excluir região"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {filteredRegionsList.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Nenhuma região encontrada com esse termo de busca.
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button type="button" className="btn-primary" onClick={() => { setIsRegionsModalOpen(false); setEditingRegionOldName(null); }}>
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
