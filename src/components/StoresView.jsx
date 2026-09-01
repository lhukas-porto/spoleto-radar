import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatPhoneNumber } from '../utils/dateHelpers';
import { 
  BRAZILIAN_STATES, 
  getCitiesForState, 
  fetchAddressByCEP, 
  formatCEP 
} from '../utils/brazilianLocations';
import { 
  Store, 
  MapPin, 
  User, 
  Plus, 
  Search, 
  Filter, 
  Star, 
  Calendar,
  X,
  FileText,
  Phone,
  Mail,
  Edit3,
  Trash2,
  Loader2,
  CheckCircle2,
  Users
} from 'lucide-react';
import FranchiseesView from './FranchiseesView';

export default function StoresView() {
  const { 
    stores, 
    consultants, 
    franchisees,
    visits, 
    addStore, 
    updateStore, 
    deleteStore, 
    setSelectedStaffForProfile, 
    setSelectedVisitForReport,
    setSelectedStoreForProfile 
  } = useApp();
  const [activeStoreTab, setActiveStoreTab] = useState('stores'); // 'stores' | 'franchisees'
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);

  // New store form state
  const [newStore, setNewStore] = useState({
    code: '',
    name: '',
    cep: '',
    city: '',
    state: 'SP',
    locationType: 'Shopping',
    address: '',
    franchisee: '',
    phone: '',
    email: '',
    consultantId: consultants.find(c => (c.role || 'CONSULTOR') === 'CONSULTOR')?.id || ''
  });

  // Edit store form state
  const [editStoreForm, setEditStoreForm] = useState({
    code: '',
    name: '',
    cep: '',
    city: '',
    state: 'SP',
    locationType: 'Shopping',
    address: '',
    franchisee: '',
    phone: '',
    email: '',
    consultantId: ''
  });

  // State for IBGE Cities per state & CEP loading status
  const [newStoreCities, setNewStoreCities] = useState([]);
  const [loadingNewCities, setLoadingNewCities] = useState(false);
  const [cepLoadingNew, setCepLoadingNew] = useState(false);
  const [cepSuccessNew, setCepSuccessNew] = useState(false);

  const [editStoreCities, setEditStoreCities] = useState([]);
  const [loadingEditCities, setLoadingEditCities] = useState(false);
  const [cepLoadingEdit, setCepLoadingEdit] = useState(false);
  const [cepSuccessEdit, setCepSuccessEdit] = useState(false);

  // Load IBGE cities for New Store UF
  useEffect(() => {
    let isMounted = true;
    async function loadCities() {
      if (!newStore.state) return;
      setLoadingNewCities(true);
      const list = await getCitiesForState(newStore.state);
      if (isMounted) {
        setNewStoreCities(list);
        setLoadingNewCities(false);
      }
    }
    loadCities();
    return () => { isMounted = false; };
  }, [newStore.state]);

  // Load IBGE cities for Edit Store UF
  useEffect(() => {
    let isMounted = true;
    async function loadCities() {
      if (!editStoreForm.state) return;
      setLoadingEditCities(true);
      const list = await getCitiesForState(editStoreForm.state);
      if (isMounted) {
        setEditStoreCities(list);
        setLoadingEditCities(false);
      }
    }
    loadCities();
    return () => { isMounted = false; };
  }, [editStoreForm.state]);

  // CEP Auto-lookup handler for New Store
  const handleCepChangeNew = async (rawVal) => {
    const masked = formatCEP(rawVal);
    setNewStore(prev => ({ ...prev, cep: masked }));
    const cleanDigits = masked.replace(/\D/g, '');

    if (cleanDigits.length === 8) {
      setCepLoadingNew(true);
      setCepSuccessNew(false);
      const data = await fetchAddressByCEP(cleanDigits);
      setCepLoadingNew(false);
      if (data) {
        setCepSuccessNew(true);
        setNewStore(prev => ({
          ...prev,
          state: data.state || prev.state,
          city: data.city || prev.city,
          address: data.fullAddress ? `${data.fullAddress}, ` : prev.address
        }));
      }
    } else {
      setCepSuccessNew(false);
    }
  };

  // CEP Auto-lookup handler for Edit Store
  const handleCepChangeEdit = async (rawVal) => {
    const masked = formatCEP(rawVal);
    setEditStoreForm(prev => ({ ...prev, cep: masked }));
    const cleanDigits = masked.replace(/\D/g, '');

    if (cleanDigits.length === 8) {
      setCepLoadingEdit(true);
      setCepSuccessEdit(false);
      const data = await fetchAddressByCEP(cleanDigits);
      setCepLoadingEdit(false);
      if (data) {
        setCepSuccessEdit(true);
        setEditStoreForm(prev => ({
          ...prev,
          state: data.state || prev.state,
          city: data.city || prev.city,
          address: data.fullAddress ? `${data.fullAddress}, ` : prev.address
        }));
      }
    } else {
      setCepSuccessEdit(false);
    }
  };

  // Extract unique states currently present in stores
  const presentStates = Array.from(new Set(stores.map(s => s.state).filter(Boolean))).sort();

  const filteredStores = stores.filter(store => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (store.name || '').toLowerCase().includes(term) ||
                          (store.city || '').toLowerCase().includes(term) ||
                          (store.code || '').toLowerCase().includes(term) ||
                          (store.franchisee || '').toLowerCase().includes(term);
    const matchesState = stateFilter === 'Todos' || store.state === stateFilter;
    return matchesSearch && matchesState;
  });

  const handleSaveStore = (e) => {
    e.preventDefault();
    if (!newStore.name.trim() || !newStore.code.trim()) {
      alert('Preencha pelo menos o Código RP e o Nome da Loja.');
      return;
    }
    addStore({
      ...newStore,
      name: newStore.name.toUpperCase().trim(),
      code: newStore.code.toUpperCase().trim(),
      franchisee: (newStore.franchisee || '').toUpperCase().trim(),
      email: (newStore.email || '').toLowerCase().trim()
    });
    setIsModalOpen(false);
    setNewStore({
      code: '',
      name: '',
      cep: '',
      city: '',
      state: 'SP',
      locationType: 'Shopping',
      address: '',
      franchisee: '',
      phone: '',
      email: '',
      consultantId: consultants.find(c => (c.role || 'CONSULTOR') === 'CONSULTOR')?.id || ''
    });
    setCepSuccessNew(false);
  };

  const handleOpenEditStore = (store) => {
    setEditingStore(store);
    setCepSuccessEdit(false);
    setEditStoreForm({
      code: store.code || '',
      name: store.name || '',
      cep: store.cep ? formatCEP(store.cep) : '',
      city: store.city || '',
      state: store.state || 'SP',
      locationType: store.locationType || 'Shopping',
      address: store.address || '',
      franchisee: store.franchisee || '',
      phone: store.phone ? formatPhoneNumber(store.phone) : '',
      email: store.email ? store.email.toLowerCase().trim() : '',
      consultantId: store.consultantId || ''
    });
  };

  const handleSaveEditStore = (e) => {
    e.preventDefault();
    if (!editingStore) return;
    if (!editStoreForm.name.trim() || !editStoreForm.code.trim()) {
      alert('Preencha pelo menos o Código RP e o Nome da Loja.');
      return;
    }
    updateStore(editingStore.id, {
      ...editStoreForm,
      name: editStoreForm.name.toUpperCase().trim(),
      code: editStoreForm.code.toUpperCase().trim(),
      email: (editStoreForm.email || '').toLowerCase().trim(),
      franchisee: editStoreForm.franchisee ? editStoreForm.franchisee.toUpperCase().trim() : ''
    });
    setEditingStore(null);
  };

  const handleDeleteStore = (store) => {
    if (window.confirm(`Tem certeza que deseja remover a unidade "${store.name}" (${store.code})?`)) {
      deleteStore(store.id);
      setEditingStore(null);
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Rede de Lojas Spoleto</h1>
          <p className="section-subtitle">Gestão das franquias, franqueados responsáveis e consultores vinculados por Código RP.</p>
        </div>

        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Cadastrar Nova Loja
        </button>
      </div>

      {/* Sub-abas de Navegação: Lojas Físicas vs Franqueados da Rede */}
      <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <button
          type="button"
          onClick={() => setActiveStoreTab('stores')}
          style={{
            padding: '0.55rem 1.15rem',
            borderRadius: 'var(--radius-md)',
            border: activeStoreTab === 'stores' ? '1.5px solid var(--primary-brown)' : '1px solid var(--border-subtle)',
            background: activeStoreTab === 'stores' ? 'var(--primary-brown)' : '#FFFFFF',
            color: activeStoreTab === 'stores' ? '#FFFFFF' : 'var(--text-main)',
            fontWeight: 800,
            fontSize: '0.84rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            boxShadow: activeStoreTab === 'stores' ? '0 2px 8px rgba(93,56,38,0.2)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Store size={16} /> Lojas Físicas ({stores.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveStoreTab('franchisees')}
          style={{
            padding: '0.55rem 1.15rem',
            borderRadius: 'var(--radius-md)',
            border: activeStoreTab === 'franchisees' ? '1.5px solid var(--primary-brown)' : '1px solid var(--border-subtle)',
            background: activeStoreTab === 'franchisees' ? 'var(--primary-brown)' : '#FFFFFF',
            color: activeStoreTab === 'franchisees' ? '#FFFFFF' : 'var(--text-main)',
            fontWeight: 800,
            fontSize: '0.84rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            boxShadow: activeStoreTab === 'franchisees' ? '0 2px 8px rgba(93,56,38,0.2)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Users size={16} /> Franqueados da Rede ({franchisees.length})
        </button>
      </div>

      {activeStoreTab === 'franchisees' ? (
        <FranchiseesView />
      ) : (
        <>
          {/* Barra de Busca e Filtros */}
          <div className="card-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) auto', gap: '1rem', alignItems: 'center' }}>
              {/* Campo de Busca */}
              <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar por nome da loja, Código RP, cidade ou franqueado..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.4rem', width: '100%', height: '42px', margin: 0 }}
            />
          </div>

          {/* Filtro de Estado (UF) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              <Filter size={15} /> Estado (UF):
            </div>
            
            <select 
              value={stateFilter} 
              onChange={(e) => setStateFilter(e.target.value)}
              style={{ fontSize: '0.84rem', height: '42px', minWidth: '220px', margin: 0, padding: '0 0.75rem' }}
            >
              <option value="Todos">Todos os Estados ({stores.length} lojas)</option>
              {BRAZILIAN_STATES.map(s => {
                const count = stores.filter(st => st.state === s.uf).length;
                return (
                  <option key={s.uf} value={s.uf}>
                    {s.uf} - {s.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Grid de Cards de Lojas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {filteredStores.map(store => {
          const consultant = consultants.find(c => 
            c.id === store.consultantId || 
            (c.assignedStores && Array.isArray(c.assignedStores) && c.assignedStores.includes(store.id))
          );
          const storeVisits = visits.filter(v => v.storeId === store.id);
          const lastVisit = storeVisits[0];

          return (
            <div 
              key={store.id}
              className="card-panel"
              style={{
                margin: 0,
                padding: '1.35rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-brown)', background: 'var(--primary-brown-light)', padding: '0.25rem 0.55rem', borderRadius: '4px' }}>
                    Código RP: {store.code}
                  </span>
                  <span style={{ fontSize: '0.75rem', background: '#F3F4F6', color: '#374151', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                    {store.locationType}
                  </span>
                </div>

                <h3 
                  onClick={() => setSelectedStoreForProfile(store)}
                  style={{ 
                    fontSize: '1.05rem', 
                    color: 'var(--text-main)', 
                    marginBottom: '0.35rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textDecorationColor: 'transparent',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--primary-brown)';
                    e.currentTarget.style.textDecorationColor = 'var(--primary-brown)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-main)';
                    e.currentTarget.style.textDecorationColor = 'transparent';
                  }}
                  title="Clique para abrir a Ficha 360° e Linha do Tempo da Loja"
                >
                  {store.name}
                </h3>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  <MapPin size={14} color="var(--text-muted)" />
                  {store.city} - {store.state}
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Franqueado(a):</span> <strong>{store.franchisee || 'Franquia Oficial Spoleto'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Consultor(a):</span>{' '}
                    {consultant ? (
                      <span 
                        onClick={() => setSelectedStaffForProfile(consultant)}
                        style={{ color: 'var(--primary-brown)', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}
                        title="Ver Ficha do Colaborador"
                      >
                        {consultant.name}
                      </span>
                    ) : (
                      <strong>Não atribuído</strong>
                    )}
                  </div>
                  {store.phone && (
                    <a 
                      href={`https://wa.me/55${store.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.4rem', 
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        transition: 'color 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#15803D';
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                      title="Conversar com a loja no WhatsApp"
                    >
                      <Phone size={12} color="#16A34A" />
                      <span>{formatPhoneNumber(store.phone)}</span>
                    </a>
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {storeVisits.length} {storeVisits.length === 1 ? 'visita' : 'visitas'}
                </span>

                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button 
                    className="btn-secondary" 
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    onClick={() => setSelectedStoreForProfile(store)}
                    title="Abrir Ficha 360° e Histórico de Evolução"
                  >
                    <Store size={12} /> Ficha 360°
                  </button>

                  {lastVisit && (
                    <button 
                      className="btn-secondary" 
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      onClick={() => setSelectedVisitForReport(lastVisit)}
                      title="Abrir relatório da última visita"
                    >
                      <FileText size={12} /> Laudo
                    </button>
                  )}

                  <button 
                    className="btn-primary" 
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    onClick={() => handleOpenEditStore(store)}
                    title="Editar dados da unidade Spoleto"
                  >
                    <Edit3 size={12} /> Editar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </>
      )}

      {/* Modal de Cadastro de Nova Loja */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '600px', padding: '1.75rem' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Cadastrar Nova Unidade Spoleto</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveStore}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Código RP da Unidade *</label>
                  <input 
                    type="text" 
                    value={newStore.code} 
                    onChange={(e) => setNewStore({ ...newStore, code: e.target.value.toUpperCase() })} 
                    placeholder="Ex: SPO-410" 
                    style={{ textTransform: 'uppercase' }}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nome da Loja / Unidade *</label>
                  <input 
                    type="text" 
                    value={newStore.name} 
                    onChange={(e) => setNewStore({ ...newStore, name: e.target.value.toUpperCase() })} 
                    placeholder="Ex: SPOLETO SHOPPING D" 
                    style={{ textTransform: 'uppercase' }}
                    required 
                  />
                </div>

                {/* CEP com Busca Automática de Endereço */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      CEP da Unidade <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(puxe o endereço automaticamente)</span>
                    </label>
                    {cepLoadingNew && (
                      <span style={{ fontSize: '0.74rem', color: 'var(--primary-brown)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Loader2 size={12} className="spin" /> Buscando endereço...
                      </span>
                    )}
                    {cepSuccessNew && (
                      <span style={{ fontSize: '0.74rem', color: '#16A34A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle2 size={12} /> Localidade e estado identificados pelo CEP!
                      </span>
                    )}
                  </div>
                  <input 
                    type="text" 
                    value={newStore.cep} 
                    onChange={(e) => handleCepChangeNew(e.target.value)} 
                    placeholder="00000-000 (digite o CEP)" 
                    maxLength={9}
                  />
                </div>

                {/* Todos os 27 Estados do Brasil */}
                <div className="form-group">
                  <label className="form-label">Estado (UF) *</label>
                  <select 
                    value={newStore.state} 
                    onChange={(e) => setNewStore({ ...newStore, state: e.target.value, city: '' })}
                  >
                    {BRAZILIAN_STATES.map(st => (
                      <option key={st.uf} value={st.uf}>
                        {st.uf} - {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cidades Oficiais IBGE do Estado Selecionado */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Cidade (IBGE - {newStore.state}) *</label>
                    {loadingNewCities && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Carregando cidades...</span>
                    )}
                  </div>
                  <input 
                    type="text" 
                    list="new-store-cities-list"
                    value={newStore.city} 
                    onChange={(e) => setNewStore({ ...newStore, city: e.target.value })} 
                    placeholder="Digite ou selecione a cidade..." 
                    required
                  />
                  <datalist id="new-store-cities-list">
                    {newStoreCities.map(cityName => (
                      <option key={cityName} value={cityName} />
                    ))}
                  </datalist>
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de Ponto Comercial</label>
                  <select 
                    value={newStore.locationType} 
                    onChange={(e) => setNewStore({ ...newStore, locationType: e.target.value })}
                  >
                    <option value="Shopping">Shopping Center</option>
                    <option value="Rua">Loja de Rua</option>
                    <option value="Aeroporto">Aeroporto</option>
                    <option value="Hipermercado">Hipermercado / Galeria</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Nome do Franqueado Responsável</label>
                  <input 
                    type="text" 
                    value={newStore.franchisee} 
                    onChange={(e) => setNewStore({ ...newStore, franchisee: e.target.value.toUpperCase() })} 
                    placeholder="NOME COMPLETO DO FRANQUEADO" 
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Telefone / WhatsApp da Unidade</label>
                  <input 
                    type="tel" 
                    value={newStore.phone || ''} 
                    onChange={(e) => setNewStore({ ...newStore, phone: formatPhoneNumber(e.target.value) })} 
                    placeholder="(11) 3333-4444" 
                    maxLength={15}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">E-mail da Unidade / Franqueado</label>
                  <input 
                    type="email" 
                    value={newStore.email || ''} 
                    onChange={(e) => setNewStore({ ...newStore, email: e.target.value.toLowerCase() })} 
                    placeholder="loja@spoleto.com.br" 
                    style={{ textTransform: 'lowercase' }}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Endereço Completo</label>
                  <input 
                    type="text" 
                    value={newStore.address} 
                    onChange={(e) => setNewStore({ ...newStore, address: e.target.value })} 
                    placeholder="Ex: Av. Paulista, 1000 - Loja 20, Bela Vista" 
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Consultor(a) de Negócios Atribuído</label>
                  <select 
                    value={newStore.consultantId} 
                    onChange={(e) => setNewStore({ ...newStore, consultantId: e.target.value })}
                  >
                    {consultants.filter(c => (c.role || 'CONSULTOR') === 'CONSULTOR').map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.region})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar Loja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE EDIÇÃO DE UNIDADE SPOLETO
          ========================================================================= */}
      {editingStore && (
        <div className="modal-overlay" onClick={() => setEditingStore(null)}>
          <div className="modal-card" style={{ maxWidth: '650px', padding: '1.75rem' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Editar Unidade Spoleto</h2>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Código RP: <strong style={{ color: 'var(--primary-brown)' }}>{editingStore.code}</strong> &bull; {editingStore.name}
                </div>
              </div>
              <button className="modal-close" onClick={() => setEditingStore(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditStore}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Código RP da Unidade *</label>
                  <input 
                    type="text" 
                    value={editStoreForm.code} 
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, code: e.target.value.toUpperCase() })} 
                    placeholder="Ex: SPO-410" 
                    style={{ textTransform: 'uppercase' }}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nome da Loja / Unidade *</label>
                  <input 
                    type="text" 
                    value={editStoreForm.name} 
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, name: e.target.value.toUpperCase() })} 
                    placeholder="Ex: SPOLETO SHOPPING D" 
                    style={{ textTransform: 'uppercase' }}
                    required 
                  />
                </div>

                {/* CEP com Busca Automática de Endereço */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      CEP da Unidade <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(puxe o endereço automaticamente)</span>
                    </label>
                    {cepLoadingEdit && (
                      <span style={{ fontSize: '0.74rem', color: 'var(--primary-brown)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Loader2 size={12} className="spin" /> Buscando endereço...
                      </span>
                    )}
                    {cepSuccessEdit && (
                      <span style={{ fontSize: '0.74rem', color: '#16A34A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle2 size={12} /> Localidade e estado identificados pelo CEP!
                      </span>
                    )}
                  </div>
                  <input 
                    type="text" 
                    value={editStoreForm.cep || ''} 
                    onChange={(e) => handleCepChangeEdit(e.target.value)} 
                    placeholder="00000-000 (digite o CEP)" 
                    maxLength={9}
                  />
                </div>

                {/* Todos os 27 Estados do Brasil */}
                <div className="form-group">
                  <label className="form-label">Estado (UF) *</label>
                  <select 
                    value={editStoreForm.state} 
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, state: e.target.value, city: '' })}
                  >
                    {BRAZILIAN_STATES.map(st => (
                      <option key={st.uf} value={st.uf}>
                        {st.uf} - {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cidades Oficiais IBGE do Estado Selecionado */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Cidade (IBGE - {editStoreForm.state}) *</label>
                    {loadingEditCities && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Carregando cidades...</span>
                    )}
                  </div>
                  <input 
                    type="text" 
                    list="edit-store-cities-list"
                    value={editStoreForm.city} 
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, city: e.target.value })} 
                    placeholder="Digite ou selecione a cidade..." 
                    required
                  />
                  <datalist id="edit-store-cities-list">
                    {editStoreCities.map(cityName => (
                      <option key={cityName} value={cityName} />
                    ))}
                  </datalist>
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de Ponto Comercial</label>
                  <select 
                    value={editStoreForm.locationType} 
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, locationType: e.target.value })}
                  >
                    <option value="Shopping">Shopping Center</option>
                    <option value="Rua">Loja de Rua</option>
                    <option value="Aeroporto">Aeroporto</option>
                    <option value="Hipermercado">Hipermercado / Galeria</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Nome do Franqueado Responsável</label>
                  <input 
                    type="text" 
                    value={editStoreForm.franchisee} 
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, franchisee: e.target.value.toUpperCase() })} 
                    placeholder="NOME COMPLETO DO FRANQUEADO" 
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Telefone / WhatsApp da Unidade</label>
                  <input 
                    type="tel" 
                    value={editStoreForm.phone} 
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, phone: formatPhoneNumber(e.target.value) })} 
                    placeholder="(11) 3333-4444" 
                    maxLength={15}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">E-mail da Unidade / Franqueado</label>
                  <input 
                    type="email" 
                    value={editStoreForm.email} 
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, email: e.target.value.toLowerCase() })} 
                    placeholder="loja@spoleto.com.br" 
                    style={{ textTransform: 'lowercase' }}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Endereço Completo</label>
                  <input 
                    type="text" 
                    value={editStoreForm.address} 
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, address: e.target.value })} 
                    placeholder="Ex: Av. Paulista, 1000 - Loja 20, Bela Vista" 
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Consultor(a) de Negócios Atribuído</label>
                  <select 
                    value={editStoreForm.consultantId} 
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, consultantId: e.target.value })}
                  >
                    <option value="">Nenhum consultor atribuído</option>
                    {consultants.filter(c => (c.role || 'CONSULTOR') === 'CONSULTOR').map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.region})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => handleDeleteStore(editingStore)}
                  style={{ color: '#991B1B', background: 'transparent', border: '1px solid #FECACA', padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
                >
                  <Trash2 size={14} /> Excluir Unidade
                </button>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setEditingStore(null)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
