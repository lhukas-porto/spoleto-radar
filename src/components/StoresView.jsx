import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatPhoneNumber, formatBrDate } from '../utils/dateHelpers';
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
  Calendar,
  X,
  FileText,
  Phone,
  Mail,
  Edit3,
  Trash2,
  Loader2,
  CheckCircle2,
  Users,
  Building2,
  Handshake,
  RotateCcw,
  Compass,
  Camera,
  Sliders,
  Flame
} from 'lucide-react';
import FranchiseesView from './FranchiseesView';
import NetworkMapView from './NetworkMapView';
import AvatarCropModal from './AvatarCropModal';
import DateInput from './DateInput';

export default function StoresView() {
  const { 
    visibleStores: stores = [], 
    visibleConsultants: consultants = [], 
    franchisees = [],
    getStoreFranchisees,
    visibleVisits: visits = [], 
    addStore, 
    updateStore, 
    deleteStore, 
    setSelectedStaffForProfile, 
    setSelectedVisitForReport,
    setSelectedStoreForProfile,
    simulatedRole,
    activeUser,
    hasPermission,
    workShifts = []
  } = useApp();
  const [activeStoreTab, setActiveStoreTab] = useState('stores'); // 'stores' | 'map' | 'franchisees'
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('Todos');
  const [locationTypeFilter, setLocationTypeFilter] = useState('Todos');
  const [workShiftFilter, setWorkShiftFilter] = useState('Todos');
  const [franchiseeFilter, setFranchiseeFilter] = useState('Todos');
  const [consultantFilter, setConsultantFilter] = useState('Todos');
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
    workShift: '6x1',
    address: '',
    franchisee: '',
    phone: '',
    email: '',
    photoUrl: null,
    shoppingMallAdmin: '',
    franchiseContractExpiration: '',
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
    workShift: '6x1',
    address: '',
    franchisee: '',
    phone: '',
    email: '',
    photoUrl: null,
    shoppingMallAdmin: '',
    franchiseContractExpiration: '',
    consultantId: ''
  });

  // Zoom e Corte interativo de foto da loja
  const [zoomedPhoto, setZoomedPhoto] = useState(null);
  const [imageToCrop, setImageToCrop] = useState(null); // { src: string, target: 'new' | 'edit' }

  // Handlers para o corte e posicionamento circular da foto da loja
  const handleFileSelect = (file, target) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageToCrop({
        src: e.target.result,
        target
      });
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmCrop = (croppedUrl) => {
    if (imageToCrop?.target === 'new') {
      setNewStore(prev => ({ ...prev, photoUrl: croppedUrl }));
    } else if (imageToCrop?.target === 'edit') {
      setEditStoreForm(prev => ({ ...prev, photoUrl: croppedUrl }));
    }
    setImageToCrop(null);
  };

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

  // Extract unique lists for filters
  const presentStates = Array.from(new Set(stores.map(s => s.state).filter(Boolean))).sort();

  const availableFranchisees = Array.from(new Set(
    franchisees.length > 0
      ? franchisees.map(f => f.name.trim().toUpperCase())
      : stores.map(s => (s.franchisee || '').trim().toUpperCase()).filter(Boolean)
  )).filter(Boolean).sort((a, b) => a.localeCompare(b));

  const availableConsultants = consultants
    .filter(c => (c.role || 'CONSULTOR') === 'CONSULTOR')
    .sort((a, b) => a.name.localeCompare(b.name));

  const filteredStores = stores.filter(store => {
    const term = searchTerm.toLowerCase().trim();
    const cleanDigits = term.replace(/\D/g, '');

    // 1. Busca textual ampla
    const matchesSearch = !term ||
      (store.name || '').toLowerCase().includes(term) ||
      (store.city || '').toLowerCase().includes(term) ||
      (store.code || '').toLowerCase().includes(term) ||
      (store.franchisee || '').toLowerCase().includes(term) ||
      (cleanDigits && (store.phone || '').replace(/\D/g, '').includes(cleanDigits));

    // 2. Filtro por Estado (UF)
    const matchesState = stateFilter === 'Todos' || store.state === stateFilter;

    // 3. Filtro por Tipo de Ponto (Shopping, Rua, Aeroporto, Hipermercado)
    const matchesLocationType = locationTypeFilter === 'Todos' ||
      (store.locationType || '').toLowerCase().includes(locationTypeFilter.toLowerCase());

    // 4. Filtro por Escala de Trabalho (5x2, 6x1, 12x36, Mista)
    const matchesWorkShift = workShiftFilter === 'Todos' || (store.workShift || '6x1') === workShiftFilter;

    // 5. Filtro por Franqueado Responsável / Sócios
    let matchesFranchisee = franchiseeFilter === 'Todos';
    if (!matchesFranchisee) {
      const storeFrans = getStoreFranchisees ? getStoreFranchisees(store.id) : [];
      if (storeFrans.length > 0) {
        matchesFranchisee = storeFrans.some(f => f.name.toUpperCase() === franchiseeFilter.toUpperCase());
      } else {
        matchesFranchisee = (store.franchisee || '').toUpperCase().includes(franchiseeFilter.toUpperCase());
      }
    }

    // 6. Filtro por Consultor de Negócios
    let matchesConsultant = consultantFilter === 'Todos';
    if (!matchesConsultant) {
      const c = consultants.find(co => co.id === consultantFilter);
      matchesConsultant = store.consultantId === consultantFilter ||
        (c?.assignedStores && Array.isArray(c.assignedStores) && c.assignedStores.includes(store.id));
    }

    return matchesSearch && matchesState && matchesLocationType && matchesWorkShift && matchesFranchisee && matchesConsultant;
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
      workShift: newStore.workShift || '6x1',
      franchisee: (newStore.franchisee || '').toUpperCase().trim(),
      shoppingMallAdmin: (newStore.shoppingMallAdmin || '').toUpperCase().trim(),
      email: (newStore.email || '').toLowerCase().trim(),
      phone: formatPhoneNumber(newStore.phone),
      cep: formatCEP(newStore.cep)
    });
    setIsModalOpen(false);
    setNewStore({
      code: '',
      name: '',
      cep: '',
      city: '',
      state: 'SP',
      locationType: 'Shopping',
      workShift: '6x1',
      address: '',
      franchisee: '',
      phone: '',
      email: '',
      photoUrl: null,
      shoppingMallAdmin: '',
      franchiseContractExpiration: '',
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
      workShift: store.workShift || '6x1',
      address: store.address || '',
      franchisee: store.franchisee || '',
      phone: store.phone ? formatPhoneNumber(store.phone) : '',
      email: store.email ? store.email.toLowerCase().trim() : '',
      photoUrl: store.photoUrl || null,
      shoppingMallAdmin: store.shoppingMallAdmin || '',
      franchiseContractExpiration: store.franchiseContractExpiration || '',
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
      workShift: editStoreForm.workShift || '6x1',
      email: (editStoreForm.email || '').toLowerCase().trim(),
      shoppingMallAdmin: (editStoreForm.shoppingMallAdmin || '').toUpperCase().trim(),
      franchisee: editStoreForm.franchisee ? editStoreForm.franchisee.toUpperCase().trim() : '',
      phone: formatPhoneNumber(editStoreForm.phone),
      cep: formatCEP(editStoreForm.cep)
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
          <Store size={16} /> Lojas Físicas <span className="count-pill">{stores.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStoreTab('map')}
          style={{
            padding: '0.55rem 1.15rem',
            borderRadius: 'var(--radius-md)',
            border: activeStoreTab === 'map' ? '1.5px solid #DC2626' : '1px solid rgba(220, 38, 38, 0.4)',
            background: activeStoreTab === 'map' ? '#DC2626' : '#FEF2F2',
            color: activeStoreTab === 'map' ? '#FFFFFF' : '#991B1B',
            fontWeight: 800,
            fontSize: '0.84rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            boxShadow: activeStoreTab === 'map' ? '0 2px 8px rgba(220,38,38,0.3)' : 'none',
            transition: 'all 0.15s ease'
          }}
          title="Ver Mapa de Calor de não-conformidades e distribuição geográfica das lojas"
        >
          <span>🔥 Mapa de Calor & Rede Brasil</span>
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
          <Users size={16} /> Franqueados da Rede <span className="count-pill">{franchisees.length}</span>
        </button>
      </div>

      {activeStoreTab === 'map' ? (
        <NetworkMapView />
      ) : activeStoreTab === 'franchisees' ? (
        <FranchiseesView />
      ) : (
        <>
          {/* Barra de Busca e Filtros Avançados */}
          <div className="card-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            {/* Linha Superior: Busca Textual + Contador de Lojas + Botão Limpar */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Buscar por nome da loja, Código RP, cidade, telefone ou franqueado..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '2.4rem', width: '100%', height: '42px', margin: 0 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', background: '#FAF8F5', border: '1px solid var(--border-subtle)', padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}>
                  {filteredStores.length} de {stores.length} lojas
                </span>

                {(searchTerm || stateFilter !== 'Todos' || locationTypeFilter !== 'Todos' || workShiftFilter !== 'Todos' || franchiseeFilter !== 'Todos' || consultantFilter !== 'Todos') && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setSearchTerm('');
                      setStateFilter('Todos');
                      setLocationTypeFilter('Todos');
                      setWorkShiftFilter('Todos');
                      setFranchiseeFilter('Todos');
                      setConsultantFilter('Todos');
                    }}
                    style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem', color: 'var(--primary-red)', borderColor: '#FCA5A5', background: '#FEF2F2', gap: '0.35rem', display: 'flex', alignItems: 'center' }}
                    title="Limpar todos os filtros ativos"
                  >
                    <RotateCcw size={13} /> Limpar
                  </button>
                )}
              </div>
            </div>

            {/* Linha Inferior: 5 Filtros em Grid (Estado, Tipo de Ponto, Escala, Franqueado, Consultor) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)' }}>
              {/* 1. Filtro de Estado (UF) */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  <MapPin size={13} color="var(--primary-brown)" /> Estado (UF)
                </label>
                <select 
                  value={stateFilter} 
                  onChange={(e) => setStateFilter(e.target.value)}
                  style={{ fontSize: '0.84rem', height: '38px', width: '100%', margin: 0, padding: '0 0.65rem' }}
                >
                  <option value="Todos">Todos os Estados ({stores.length})</option>
                  {BRAZILIAN_STATES.map(s => {
                    const count = stores.filter(st => st.state === s.uf).length;
                    if (count === 0) return null;
                    return (
                      <option key={s.uf} value={s.uf}>
                        {s.uf} - {s.name} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* 2. Filtro de Tipo de Ponto (Shopping, Rua, Aeroporto, Hipermercado) */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  <Building2 size={13} color="var(--primary-brown)" /> Tipo de Ponto
                </label>
                <select 
                  value={locationTypeFilter} 
                  onChange={(e) => setLocationTypeFilter(e.target.value)}
                  style={{ fontSize: '0.84rem', height: '38px', width: '100%', margin: 0, padding: '0 0.65rem' }}
                >
                  <option value="Todos">Todos os Tipos ({stores.length})</option>
                  <option value="Shopping">Shopping Center ({stores.filter(s => (s.locationType || '').toLowerCase().includes('shopping')).length})</option>
                  <option value="Rua">Loja de Rua ({stores.filter(s => (s.locationType || '').toLowerCase().includes('rua')).length})</option>
                  <option value="Aeroporto">Aeroporto ({stores.filter(s => (s.locationType || '').toLowerCase().includes('aeroporto')).length})</option>
                  <option value="Hipermercado">Hipermercado / Galeria ({stores.filter(s => (s.locationType || '').toLowerCase().includes('hipermercado') || (s.locationType || '').toLowerCase().includes('galeria')).length})</option>
                </select>
              </div>

              {/* 3. Filtro de Escala de Colaboradores */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  <Calendar size={13} color="var(--primary-brown)" /> Escala Equipe
                </label>
                <select 
                  value={workShiftFilter} 
                  onChange={(e) => setWorkShiftFilter(e.target.value)}
                  style={{ fontSize: '0.84rem', height: '38px', width: '100%', margin: 0, padding: '0 0.65rem' }}
                >
                  <option value="Todos">Todas as Escalas ({stores.length})</option>
                  {(workShifts.length > 0 ? workShifts : [
                    { id: '1', name: '6x1' },
                    { id: '2', name: '5x2' },
                    { id: '3', name: '12x36' },
                    { id: '4', name: 'Mista' }
                  ]).map(ws => (
                    <option key={ws.id || ws.name} value={ws.name}>
                      Escala {ws.name} ({stores.filter(s => (s.workShift || '6x1') === ws.name).length})
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Filtro de Franqueado Responsável / Grupo */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  <Handshake size={13} color="var(--primary-brown)" /> Franqueado / Grupo
                </label>
                <select 
                  value={franchiseeFilter} 
                  onChange={(e) => setFranchiseeFilter(e.target.value)}
                  style={{ fontSize: '0.84rem', height: '38px', width: '100%', margin: 0, padding: '0 0.65rem' }}
                >
                  <option value="Todos">Todos os Franqueados ({availableFranchisees.length})</option>
                  {availableFranchisees.map(franName => {
                    const count = stores.filter(s => {
                      const storeFrans = getStoreFranchisees ? getStoreFranchisees(s.id) : [];
                      if (storeFrans.length > 0) return storeFrans.some(f => f.name.toUpperCase() === franName.toUpperCase());
                      return (s.franchisee || '').toUpperCase().includes(franName.toUpperCase());
                    }).length;
                    return (
                      <option key={franName} value={franName}>
                        {franName} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* 5. Filtro de Consultor de Negócios */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  <User size={13} color="var(--primary-brown)" /> Consultor Responsável
                </label>
                <select 
                  value={consultantFilter} 
                  onChange={(e) => setConsultantFilter(e.target.value)}
                  style={{ fontSize: '0.84rem', height: '38px', width: '100%', margin: 0, padding: '0 0.65rem' }}
                >
                  <option value="Todos">Todos os Consultores ({availableConsultants.length})</option>
                  {availableConsultants.map(c => {
                    const count = stores.filter(s => 
                      s.consultantId === c.id || 
                      (c.assignedStores && Array.isArray(c.assignedStores) && c.assignedStores.includes(s.id))
                    ).length;
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} ({count})
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
          const storeFranchisees = getStoreFranchisees ? getStoreFranchisees(store.id) : [];

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-brown)', background: 'var(--primary-brown-light)', padding: '0.25rem 0.55rem', borderRadius: '4px' }}>
                    Código RP: {store.code}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    {(() => {
                      const currentShiftName = store.workShift || '6x1';
                      const matchedShift = (workShifts || []).find(ws => ws.name === currentShiftName);
                      const bg = matchedShift?.badgeBg || (currentShiftName === '5x2' ? '#EFF6FF' : currentShiftName === '12x36' ? '#FEF3C7' : currentShiftName === 'Mista' ? '#F3E8FF' : '#F0FDF4');
                      const color = matchedShift?.badgeColor || (currentShiftName === '5x2' ? '#1D4ED8' : currentShiftName === '12x36' ? '#92400E' : currentShiftName === 'Mista' ? '#6B21A8' : '#15803D');
                      const border = matchedShift?.badgeBorder || (currentShiftName === '5x2' ? '#BFDBFE' : currentShiftName === '12x36' ? '#FDE68A' : currentShiftName === 'Mista' ? '#E9D5FF' : '#BBF7D0');

                      return (
                        <span style={{ 
                          fontSize: '0.72rem', 
                          background: bg,
                          color: color,
                          border: `1px solid ${border}`,
                          padding: '0.15rem 0.45rem', 
                          borderRadius: '4px', 
                          fontWeight: 700 
                        }}
                        title={`Escala de Trabalho dos Colaboradores: ${currentShiftName}`}
                        >
                          📅 {currentShiftName}
                        </span>
                      );
                    })()}
                    <span style={{ fontSize: '0.75rem', background: '#F3F4F6', color: '#374151', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                      {store.locationType}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.85rem' }}>
                  {/* Foto da Loja com Zoom Centralizado ao Clicar */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomedPhoto({ 
                        url: store.photoUrl || null, 
                        name: store.name, 
                        code: store.code,
                        locationType: store.locationType 
                      });
                    }}
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      border: '2px solid var(--accent-gold)',
                      overflow: 'hidden',
                      backgroundColor: 'var(--primary-brown-light)',
                      color: 'var(--primary-brown)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.25rem',
                      cursor: 'pointer',
                      flexShrink: 0,
                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                      transition: 'transform 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    title="Clique para ver a foto da loja ampliada"
                  >
                    {store.photoUrl ? (
                      <img src={store.photoUrl} alt={store.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Store size={26} color="var(--primary-brown)" />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 
                      onClick={() => setSelectedStoreForProfile(store)}
                      style={{ 
                        fontSize: '1.02rem', 
                        color: 'var(--text-main)', 
                        margin: '0 0 0.25rem 0',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        textDecorationColor: 'transparent',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
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

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <MapPin size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {store.city} - {store.state}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {storeFranchisees.length > 1 ? 'Sócios / Franqueados:' : 'Franqueado(a):'}
                    </span>{' '}
                    <strong>
                      {storeFranchisees.length > 0
                        ? storeFranchisees.map(f => f.name).join(' • ')
                        : (store.franchisee || 'Franquia Oficial Spoleto')}
                    </strong>
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

                  {store.shoppingMallAdmin && (
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Administradora:</span>{' '}
                      <strong style={{ color: 'var(--text-main)' }}>{store.shoppingMallAdmin}</strong>
                    </div>
                  )}

                  {store.franchiseContractExpiration && (
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Venc. Contrato Franquia:</span>{' '}
                      <strong style={{ color: 'var(--primary-brown)' }}>{formatBrDate(store.franchiseContractExpiration)}</strong>
                    </div>
                  )}

                  {/* Contatos dos Franqueados / Sócios ou da Loja */}
                  {storeFranchisees.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.2rem' }}>
                      {storeFranchisees.map(f => {
                        const cleanPhone = (f.phone || '').replace(/\D/g, '');
                        return (
                          <div key={f.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#FAF8F5', border: '1px solid var(--border-subtle)', padding: '0.2rem 0.45rem', borderRadius: '4px', fontSize: '0.74rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--primary-brown)' }}>{f.name.split(' ')[0]}:</span>
                            {cleanPhone && (
                              <a href={`https://wa.me/55${cleanPhone}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: '#166534', display: 'flex', alignItems: 'center' }} title={`WhatsApp de ${f.name}: ${f.phone}`}>
                                <Phone size={11} />
                              </a>
                            )}
                            {f.email && (
                              <a href={`mailto:${f.email}`} onClick={(e) => e.stopPropagation()} style={{ color: 'var(--primary-brown)', display: 'flex', alignItems: 'center' }} title={`E-mail de ${f.name}: ${f.email}`}>
                                <Mail size={11} />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : store.phone && (
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
                        textDecoration: 'none'
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

                  {hasPermission('store_profile_edit') && (
                    <button 
                      className="btn-primary" 
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      onClick={() => handleOpenEditStore(store)}
                      title="Editar dados da unidade Spoleto"
                    >
                      <Edit3 size={12} /> Editar
                    </button>
                  )}
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
              {/* Upload de Foto da Loja */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '0.75rem', background: '#FAF8F5', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-strong)', marginBottom: '1rem' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  border: '2px solid var(--accent-gold)',
                  overflow: 'hidden',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {newStore.photoUrl ? (
                    <img src={newStore.photoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Camera size={24} color="var(--text-muted)" />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ marginBottom: '0.25rem' }}>Foto da Fachada / Unidade</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      handleFileSelect(e.target.files?.[0], 'new');
                      e.target.value = '';
                    }}
                    style={{ fontSize: '0.8rem' }}
                  />
                  {newStore.photoUrl && (
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem', alignItems: 'center' }}>
                      <button 
                        type="button" 
                        onClick={() => setImageToCrop({ src: newStore.photoUrl, target: 'new' })}
                        style={{ fontSize: '0.74rem', color: 'var(--primary-brown)', background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '4px', cursor: 'pointer', padding: '0.2rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}
                        title="Reposicionar ou dar zoom na foto"
                      >
                        <Sliders size={12} /> Ajustar Posição / Zoom
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setNewStore({ ...newStore, photoUrl: null })}
                        style={{ fontSize: '0.74rem', color: '#991B1B', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        Remover Foto
                      </button>
                    </div>
                  )}
                </div>
              </div>

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

                {/* Endereço Completo posicionado logo abaixo do CEP */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Endereço Completo</label>
                  <input 
                    type="text" 
                    value={newStore.address} 
                    onChange={(e) => setNewStore({ ...newStore, address: e.target.value })} 
                    placeholder="Ex: Av. Paulista, 1000 - Loja 20, Bela Vista" 
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
                    <label className="form-label" style={{ margin: 0 }}>Cidade *</label>
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
                  <label className="form-label">Escala de Colaboradores</label>
                  <select 
                    value={newStore.workShift || '6x1'} 
                    onChange={(e) => setNewStore({ ...newStore, workShift: e.target.value })}
                  >
                    {(workShifts.length > 0 ? workShifts : [
                      { id: '1', name: '6x1', label: '6x1 (Padrão Varejo / Shopping)' },
                      { id: '2', name: '5x2', label: '5x2 (Comercial / Administrativo)' },
                      { id: '3', name: '12x36', label: '12x36 (Jornada 12h)' },
                      { id: '4', name: 'Mista', label: 'Mista (Operação Combinada)' }
                    ]).map(ws => (
                      <option key={ws.id || ws.name} value={ws.name}>
                        {ws.label || ws.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Administradora do Shopping / Empreendimento</label>
                  <input 
                    type="text" 
                    value={newStore.shoppingMallAdmin || ''} 
                    onChange={(e) => setNewStore({ ...newStore, shoppingMallAdmin: e.target.value.toUpperCase() })} 
                    placeholder="Ex: ALLOS, ANCAR, IGUATEMI, MULTIPLAN..." 
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Vencimento do Contrato de Franquias</label>
                  <DateInput 
                    value={newStore.franchiseContractExpiration || ''} 
                    onChange={(val) => setNewStore({ ...newStore, franchiseContractExpiration: val })} 
                    placeholder="DD/MM/AAAA"
                  />
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
              {/* Upload de Foto da Loja */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '0.75rem', background: '#FAF8F5', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-strong)', marginBottom: '1rem' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  border: '2px solid var(--accent-gold)',
                  overflow: 'hidden',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {editStoreForm.photoUrl ? (
                    <img src={editStoreForm.photoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Camera size={24} color="var(--text-muted)" />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ marginBottom: '0.25rem' }}>Alterar Foto da Fachada / Unidade</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      handleFileSelect(e.target.files?.[0], 'edit');
                      e.target.value = '';
                    }}
                    style={{ fontSize: '0.8rem' }}
                  />
                  {editStoreForm.photoUrl && (
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem', alignItems: 'center' }}>
                      <button 
                        type="button" 
                        onClick={() => setImageToCrop({ src: editStoreForm.photoUrl, target: 'edit' })}
                        style={{ fontSize: '0.74rem', color: 'var(--primary-brown)', background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '4px', cursor: 'pointer', padding: '0.2rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}
                        title="Reposicionar ou dar zoom na foto"
                      >
                        <Sliders size={12} /> Ajustar Posição / Zoom
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setEditStoreForm({ ...editStoreForm, photoUrl: null })}
                        style={{ fontSize: '0.74rem', color: '#991B1B', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        Remover Foto
                      </button>
                    </div>
                  )}
                </div>
              </div>

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

                {/* Endereço Completo posicionado logo abaixo do CEP */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Endereço Completo</label>
                  <input 
                    type="text" 
                    value={editStoreForm.address} 
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, address: e.target.value })} 
                    placeholder="Ex: Av. Paulista, 1000 - Loja 20, Bela Vista" 
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
                    <label className="form-label" style={{ margin: 0 }}>Cidade *</label>
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
                  <label className="form-label">Escala de Colaboradores</label>
                  <select 
                    value={editStoreForm.workShift || '6x1'} 
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, workShift: e.target.value })}
                  >
                    {(workShifts.length > 0 ? workShifts : [
                      { id: '1', name: '6x1', label: '6x1 (Padrão Varejo / Shopping)' },
                      { id: '2', name: '5x2', label: '5x2 (Comercial / Administrativo)' },
                      { id: '3', name: '12x36', label: '12x36 (Jornada 12h)' },
                      { id: '4', name: 'Mista', label: 'Mista (Operação Combinada)' }
                    ]).map(ws => (
                      <option key={ws.id || ws.name} value={ws.name}>
                        {ws.label || ws.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Administradora do Shopping / Empreendimento</label>
                  <input 
                    type="text" 
                    value={editStoreForm.shoppingMallAdmin || ''} 
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, shoppingMallAdmin: e.target.value.toUpperCase() })} 
                    placeholder="Ex: ALLOS, ANCAR, IGUATEMI, MULTIPLAN..." 
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Vencimento do Contrato de Franquias</label>
                  <DateInput 
                    value={editStoreForm.franchiseContractExpiration || ''} 
                    onChange={(val) => setEditStoreForm({ ...editStoreForm, franchiseContractExpiration: val })} 
                    placeholder="DD/MM/AAAA"
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">Nome do Franqueado / Sócios</label>
                    <span 
                      onClick={() => { setEditingStore(null); setActiveStoreTab('franchisees'); }}
                      style={{ fontSize: '0.72rem', color: 'var(--primary-brown)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 700 }}
                      title="Ir para a aba de Franqueados para gestão de múltiplos sócios"
                    >
                      🤝 Gerenciar Sócios
                    </span>
                  </div>
                  <input 
                    type="text" 
                    value={editStoreForm.franchisee} 
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, franchisee: e.target.value.toUpperCase() })} 
                    placeholder="NOME COMPLETO DO FRANQUEADO OU SÓCIOS" 
                    style={{ textTransform: 'uppercase' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Dica: Para vincular múltiplos sócios nesta loja, use a aba <strong>Franqueados da Rede</strong>.
                  </span>
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

      {/* Modal para Visualização da Foto da Loja Ampliada */}
      {zoomedPhoto && (
        <div className="modal-overlay" onClick={() => setZoomedPhoto(null)} style={{ zIndex: 9999 }}>
          <div 
            className="modal-card" 
            style={{ maxWidth: '420px', textAlign: 'center', padding: '2rem 1.5rem', borderRadius: 'var(--radius-lg)' }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.78rem', background: 'var(--primary-brown-light)', color: 'var(--primary-brown)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontWeight: 800 }}>
                Código RP: {zoomedPhoto.code || 'SPO'}
              </span>
              <h3 style={{ margin: '0.5rem 0 0.15rem', color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: 800 }}>
                {zoomedPhoto.name}
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {zoomedPhoto.locationType || 'Unidade Spoleto'}
              </p>
            </div>

            <div style={{ 
              width: '100%', 
              maxWidth: '380px', 
              aspectRatio: '1 / 1', 
              margin: '0 auto', 
              borderRadius: '16px', 
              overflow: 'hidden', 
              border: '3px solid var(--accent-gold)', 
              boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
              backgroundColor: 'var(--primary-brown-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-brown)'
            }}>
              {zoomedPhoto.url ? (
                <img 
                  src={zoomedPhoto.url} 
                  alt={zoomedPhoto.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <Store size={80} color="var(--primary-brown)" />
              )}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <button 
                className="btn-secondary" 
                onClick={() => setZoomedPhoto(null)}
                style={{ fontSize: '0.84rem', padding: '0.45rem 1.5rem' }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Interativo de Corte e Posicionamento Circular da Foto da Loja */}
      {imageToCrop && (
        <AvatarCropModal
          imageSrc={imageToCrop.src}
          title="Ajustar Foto da Unidade Spoleto"
          subtitle="Arraste a foto da loja para enquadrar a fachada e use a barra de zoom para aproximar."
          onConfirm={handleConfirmCrop}
          onCancel={() => setImageToCrop(null)}
        />
      )}

    </div>
  );
}
