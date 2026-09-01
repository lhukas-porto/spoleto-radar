import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { formatPhoneNumber } from '../utils/dateHelpers';
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
  Trash2,
  Camera,
  Upload,
  Award,
  Layers,
  Building2,
  User
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
    setSelectedStaffForProfile,
    setManagingSubordinatesLeader,
    setActiveTab 
  } = useApp();

  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'DIRETORIA' | 'GERENTE_NACIONAL' | 'GERENTE_REGIONAL' | 'CONSULTOR'
  const [searchTerm, setSearchTerm] = useState('');

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
  const [zoomedPhoto, setZoomedPhoto] = useState(null);

  // Edit Consultant Form State
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'CONSULTOR',
    reportsTo: '',
    region: availableRegions[0] || 'SP - Capital',
    email: '',
    phone: '',
    photoUrl: null
  });

  // Store selection state inside assignment modal
  const [assignedStoreIds, setAssignedStoreIds] = useState([]);
  const [storeSearch, setStoreSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('Todos');
  const [availabilityFilter, setAvailabilityFilter] = useState('Todas'); // 'Todas' | 'Deste Consultor' | 'Disponíveis' | 'Outros Consultores'

  // New Consultant state
  const [newCons, setNewCons] = useState({
    name: '',
    role: 'CONSULTOR',
    reportsTo: '',
    email: '',
    phone: '',
    region: availableRegions[0] || 'SP - Capital',
    photoUrl: null
  });

  // Helper to render grouped superior options
  const renderSuperiorOptions = (excludeId = null) => {
    const diretoria = consultants.filter(c => c.role === 'DIRETORIA' && c.id !== excludeId);
    const nacional = consultants.filter(c => c.role === 'GERENTE_NACIONAL' && c.id !== excludeId);
    const regional = consultants.filter(c => c.role === 'GERENTE_REGIONAL' && c.id !== excludeId);

    return (
      <>
        <option value="">Sem superior (Nível Máximo / Reporta ao Conselho)</option>
        
        {diretoria.length > 0 && (
          <optgroup label="🏛️ Diretoria Executiva">
            {diretoria.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.region})
              </option>
            ))}
          </optgroup>
        )}

        {nacional.length > 0 && (
          <optgroup label="🌐 Gerência Nacional">
            {nacional.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.region})
              </option>
            ))}
          </optgroup>
        )}

        {regional.length > 0 && (
          <optgroup label="🏢 Gerências Regionais">
            {regional.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.region})
              </option>
            ))}
          </optgroup>
        )}
      </>
    );
  };

  // Helper for image upload & compression
  const processImageFile = (file, callback) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 260;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        callback(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

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
      role: consultant.role || 'CONSULTOR',
      reportsTo: consultant.reportsTo || '',
      region: consultant.region || availableRegions[0] || '',
      email: consultant.email || '',
      phone: consultant.phone || '',
      photoUrl: consultant.photoUrl || null
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      alert('Preencha pelo menos o Nome do colaborador.');
      return;
    }
    updateConsultant(editingConsultant.id, {
      ...editForm,
      name: editForm.name.toUpperCase().trim(),
      email: (editForm.email || '').toLowerCase().trim(),
      role: editForm.role || 'CONSULTOR',
      reportsTo: editForm.reportsTo || null
    });
    setEditingConsultant(null);
  };

  const handleDeleteConsultant = (consultant) => {
    if (confirm(`Tem certeza que deseja excluir "${consultant.name}" da Equipe Spoleto?`)) {
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
      alert('Preencha pelo menos o Nome do Colaborador.');
      return;
    }
    addConsultant({
      ...newCons,
      name: newCons.name.toUpperCase().trim(),
      email: (newCons.email || '').toLowerCase().trim(),
      role: newCons.role || 'CONSULTOR',
      reportsTo: newCons.reportsTo || null
    });
    setIsAddModalOpen(false);
    setNewCons({
      name: '',
      role: 'CONSULTOR',
      reportsTo: '',
      email: '',
      phone: '',
      region: availableRegions[0] || 'SP - Capital',
      photoUrl: null
    });
  };

  // Filter team members
  const filteredConsultants = consultants.filter(c => {
    const role = c.role || 'CONSULTOR';
    const matchesRole = roleFilter === 'ALL' || role === roleFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      c.name.toLowerCase().includes(term) ||
      (c.region && c.region.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term));
    return matchesRole && matchesSearch;
  });

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

  // Helper for role tags
  const getRoleTag = (r) => {
    switch (r) {
      case 'DIRETORIA':
        return { label: 'Diretoria', bg: '#FEE2E2', color: '#991B1B', icon: '🏛️' };
      case 'GERENTE_NACIONAL':
        return { label: 'Gerência Nacional', bg: '#DBEAFE', color: '#1E40AF', icon: '🌐' };
      case 'GERENTE_REGIONAL':
        return { label: 'Gerência Regional', bg: '#FEF9C3', color: '#854D0E', icon: '🏢' };
      case 'CONSULTOR':
      default:
        return { label: 'Consultoria', bg: '#DCFCE7', color: '#166534', icon: '👨‍💼' };
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Equipe Spoleto & Gestão de Pessoas</h1>
          <p className="section-subtitle">Estrutura organizacional integrada: Diretoria, Gerência Nacional, Gerências Regionais e Consultores de Negócios.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => setIsRegionsModalOpen(true)}>
            <MapPin size={18} /> Gerenciar Regiões ({availableRegions.length})
          </button>
          <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} /> Cadastrar Membro
          </button>
        </div>
      </div>

      {/* Role Navigation Tabs & Search Bar */}
      <div className="card-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Sub-Tabs Hierárquicas */}
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            <button
              className={`btn-secondary ${roleFilter === 'ALL' ? 'btn-primary' : ''}`}
              onClick={() => setRoleFilter('ALL')}
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem' }}
            >
              Todos ({consultants.length})
            </button>

            <button
              className={`btn-secondary ${roleFilter === 'DIRETORIA' ? 'btn-primary' : ''}`}
              onClick={() => setRoleFilter('DIRETORIA')}
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem' }}
            >
              🏛️ Diretoria ({consultants.filter(c => c.role === 'DIRETORIA').length})
            </button>

            <button
              className={`btn-secondary ${roleFilter === 'GERENTE_NACIONAL' ? 'btn-primary' : ''}`}
              onClick={() => setRoleFilter('GERENTE_NACIONAL')}
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem' }}
            >
              🌐 Gerência Nacional ({consultants.filter(c => c.role === 'GERENTE_NACIONAL').length})
            </button>

            <button
              className={`btn-secondary ${roleFilter === 'GERENTE_REGIONAL' ? 'btn-primary' : ''}`}
              onClick={() => setRoleFilter('GERENTE_REGIONAL')}
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem' }}
            >
              🏢 Gerências Regionais ({consultants.filter(c => c.role === 'GERENTE_REGIONAL').length})
            </button>

            <button
              className={`btn-secondary ${roleFilter === 'CONSULTOR' ? 'btn-primary' : ''}`}
              onClick={() => setRoleFilter('CONSULTOR')}
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem' }}
            >
              👨‍💼 Consultores ({consultants.filter(c => (c.role || 'CONSULTOR') === 'CONSULTOR').length})
            </button>
          </div>

          {/* Busca */}
          <div style={{ position: 'relative', minWidth: '240px', flex: 1, maxWidth: '360px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar por nome, região ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.2rem', fontSize: '0.82rem', width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Grid de Membros da Equipe Spoleto */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {filteredConsultants.map(consultant => {
          const role = consultant.role || 'CONSULTOR';
          const roleInfo = getRoleTag(role);
          const assignedStores = stores.filter(s => 
            s.consultantId === consultant.id || 
            (consultant.assignedStores && Array.isArray(consultant.assignedStores) && consultant.assignedStores.includes(s.id))
          );
          const storeCount = (consultant.assignedStores && consultant.assignedStores.length > 0) 
            ? consultant.assignedStores.length 
            : assignedStores.length;

          // Superior info
          const superior = consultant.reportsTo ? consultants.find(c => c.id === consultant.reportsTo) : null;
          const subordinatesCount = consultants.filter(c => c.reportsTo === consultant.id).length;

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
                border: '1px solid var(--border-subtle)',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.55rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: roleInfo.bg,
                    color: roleInfo.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}>
                    <span>{roleInfo.icon}</span> {roleInfo.label}
                  </span>

                  {role === 'CONSULTOR' ? (
                    <span style={{ fontSize: '0.75rem', background: '#F3F4F6', color: '#374151', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                      {storeCount} loja{storeCount !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', background: '#F3F4F6', color: '#374151', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                      {subordinatesCount} liderado(s)
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.85rem' }}>
                  {/* Foto de Perfil com Zoom Centralizado ao Clicar */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomedPhoto({ 
                        url: consultant.photoUrl || null, 
                        name: consultant.name, 
                        role: consultant.role 
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
                    title="Clique para ver a foto ampliada"
                  >
                    {consultant.photoUrl ? (
                      <img src={consultant.photoUrl} alt={consultant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      consultant.name.split(' ').map(n => n[0]).slice(0, 2).join('')
                    )}
                  </div>

                  <div>
                    <h3 
                      onClick={() => setSelectedStaffForProfile(consultant)}
                      style={{ 
                        fontSize: '1.05rem', 
                        color: 'var(--text-main)', 
                        margin: 0, 
                        cursor: 'pointer', 
                        fontWeight: 700,
                        textDecoration: 'underline', 
                        textDecorationColor: 'transparent', 
                        transition: 'all 0.15s ease' 
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.textDecorationColor = 'var(--primary-brown)';
                        e.currentTarget.style.color = 'var(--primary-brown)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecorationColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-main)';
                      }}
                      title="Clique no nome para abrir a Ficha 360° do Colaborador"
                    >
                      {consultant.name}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary-brown)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                      <MapPin size={12} /> {consultant.region}
                    </div>
                  </div>
                </div>

                {/* Superior ou Liderados */}
                {superior && (
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', background: '#FAF8F5', padding: '0.35rem 0.6rem', borderRadius: '4px', marginBottom: '0.75rem' }}>
                    Superior: <strong style={{ color: 'var(--text-main)' }}>{superior.name}</strong> ({superior.role?.replace(/_/g, ' ')})
                  </div>
                )}

                {(consultant.email || consultant.phone) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {consultant.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <Mail size={13} color="var(--text-muted)" />
                        {consultant.email}
                      </div>
                    )}
                    {consultant.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <Phone size={13} color="var(--text-muted)" />
                        {formatPhoneNumber(consultant.phone)}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Ações do Card */}
              <div style={{ display: 'flex', gap: '0.4rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
                {role === 'CONSULTOR' ? (
                  <button 
                    className="btn-secondary" 
                    style={{ flex: 1, fontSize: '0.78rem', padding: '0.35rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                    onClick={() => handleOpenManageStores(consultant)}
                    title="Definir Lojas da Carteira"
                  >
                    <Store size={13} /> Lojas ({storeCount})
                  </button>
                ) : (
                  <button 
                    className="btn-secondary" 
                    style={{ flex: 1, fontSize: '0.78rem', padding: '0.35rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                    onClick={() => setManagingSubordinatesLeader(consultant)}
                    title="Definir Liderados Diretos da Equipe"
                  >
                    <Users size={13} /> Liderados ({subordinatesCount})
                  </button>
                )}

                <button 
                  className="btn-primary" 
                  style={{ flex: 1, fontSize: '0.78rem', padding: '0.35rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                  onClick={() => handleOpenEditModal(consultant)}
                  title="Editar Cadastro e Foto"
                >
                  <Edit3 size={13} /> Editar
                </button>

                <button 
                  type="button" 
                  onClick={() => handleDeleteConsultant(consultant)}
                  style={{ 
                    color: '#991B1B', 
                    backgroundColor: '#FEF2F2', 
                    border: '1px solid #FECACA', 
                    padding: '0.35rem 0.65rem', 
                    borderRadius: 'var(--radius-sm)', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '0.3rem', 
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#DC2626';
                    e.currentTarget.style.color = '#FFFFFF';
                    e.currentTarget.style.borderColor = '#DC2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FEF2F2';
                    e.currentTarget.style.color = '#991B1B';
                    e.currentTarget.style.borderColor = '#FECACA';
                  }}
                  title={`Excluir ${consultant.name}`}
                >
                  <Trash2 size={13} /> Excluir
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          MODAL DE CADASTRO DE NOVO MEMBRO DA EQUIPE SPOLETO
          ========================================================================= */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '580px', padding: '1.75rem' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Cadastrar Novo Membro - Equipe Spoleto</h2>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveConsultant}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Upload de Foto */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '0.75rem', background: '#FAF8F5', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-strong)' }}>
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
                    {newCons.photoUrl ? (
                      <img src={newCons.photoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Camera size={24} color="var(--text-muted)" />
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <label className="form-label" style={{ marginBottom: '0.25rem' }}>Foto de Perfil</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => processImageFile(e.target.files?.[0], (url) => setNewCons({ ...newCons, photoUrl: url }))}
                      style={{ fontSize: '0.8rem' }}
                    />
                    {newCons.photoUrl && (
                      <button 
                        type="button" 
                        onClick={() => setNewCons({ ...newCons, photoUrl: null })}
                        style={{ fontSize: '0.72rem', color: '#991B1B', background: 'transparent', border: 'none', cursor: 'pointer', marginTop: '0.25rem', padding: 0 }}
                      >
                        Remover Foto
                      </button>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nome Completo *</label>
                  <input 
                    type="text" 
                    value={newCons.name} 
                    onChange={(e) => setNewCons({ ...newCons, name: e.target.value.toUpperCase() })} 
                    placeholder="Ex: CARLOS HENRIQUE SILVA"
                    style={{ textTransform: 'uppercase' }}
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Cargo / Nível Hierárquico *</label>
                    <select 
                      value={newCons.role} 
                      onChange={(e) => setNewCons({ ...newCons, role: e.target.value })}
                    >
                      <option value="CONSULTOR">👨‍💼 Consultor de Negócios</option>
                      <option value="GERENTE_REGIONAL">🏢 Gerente Regional</option>
                      <option value="GERENTE_NACIONAL">🌐 Gerente Nacional</option>
                      <option value="DIRETORIA">🏛️ Diretoria Executiva</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Superior Imediato</label>
                    <select 
                      value={newCons.reportsTo} 
                      onChange={(e) => setNewCons({ ...newCons, reportsTo: e.target.value })}
                    >
                      {renderSuperiorOptions()}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Região Oficial *</label>
                  <select 
                    value={newCons.region} 
                    onChange={(e) => setNewCons({ ...newCons, region: e.target.value })}
                  >
                    {availableRegions.map(reg => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">E-mail Corporativo</label>
                    <input 
                      type="email" 
                      value={newCons.email} 
                      onChange={(e) => setNewCons({ ...newCons, email: e.target.value.toLowerCase() })} 
                      placeholder="nome@spoleto.com.br" 
                      style={{ textTransform: 'lowercase' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">WhatsApp / Telefone</label>
                    <input 
                      type="tel" 
                      value={newCons.phone} 
                      onChange={(e) => setNewCons({ ...newCons, phone: formatPhoneNumber(e.target.value) })} 
                      placeholder="(21) 98765-4321" 
                      maxLength={15}
                    />
                  </div>
                </div>

              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Cadastrar Membro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE EDIÇÃO DE MEMBRO DA EQUIPE SPOLETO & FOTO
          ========================================================================= */}
      {editingConsultant && (
        <div className="modal-overlay" onClick={() => setEditingConsultant(null)}>
          <div className="modal-card" style={{ maxWidth: '580px', padding: '1.75rem' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Editar Cadastro - {editingConsultant.name}</h2>
              <button className="modal-close" onClick={() => setEditingConsultant(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Upload de Foto */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '0.75rem', background: '#FAF8F5', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-strong)' }}>
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
                    {editForm.photoUrl ? (
                      <img src={editForm.photoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Camera size={24} color="var(--text-muted)" />
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <label className="form-label" style={{ marginBottom: '0.25rem' }}>Alterar Foto de Perfil</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => processImageFile(e.target.files?.[0], (url) => setEditForm({ ...editForm, photoUrl: url }))}
                      style={{ fontSize: '0.8rem' }}
                    />
                    {editForm.photoUrl && (
                      <button 
                        type="button" 
                        onClick={() => setEditForm({ ...editForm, photoUrl: null })}
                        style={{ fontSize: '0.72rem', color: '#991B1B', background: 'transparent', border: 'none', cursor: 'pointer', marginTop: '0.25rem', padding: 0 }}
                      >
                        Remover Foto
                      </button>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nome Completo *</label>
                  <input 
                    type="text" 
                    value={editForm.name} 
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value.toUpperCase() })} 
                    style={{ textTransform: 'uppercase' }}
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Cargo / Nível Hierárquico *</label>
                    <select 
                      value={editForm.role} 
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    >
                      <option value="CONSULTOR">👨‍💼 Consultor de Negócios</option>
                      <option value="GERENTE_REGIONAL">🏢 Gerente Regional</option>
                      <option value="GERENTE_NACIONAL">🌐 Gerente Nacional</option>
                      <option value="DIRETORIA">🏛️ Diretoria Executiva</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Superior Imediato</label>
                    <select 
                      value={editForm.reportsTo} 
                      onChange={(e) => setEditForm({ ...editForm, reportsTo: e.target.value })}
                    >
                      {renderSuperiorOptions(editingConsultant.id)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Região Oficial *</label>
                  <select 
                    value={editForm.region} 
                    onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
                  >
                    {availableRegions.map(reg => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">E-mail Corporativo</label>
                    <input 
                      type="email" 
                      value={editForm.email} 
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value.toLowerCase() })} 
                      placeholder="nome@spoleto.com.br" 
                      style={{ textTransform: 'lowercase' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">WhatsApp / Telefone</label>
                    <input 
                      type="tel" 
                      value={editForm.phone} 
                      onChange={(e) => setEditForm({ ...editForm, phone: formatPhoneNumber(e.target.value) })} 
                      placeholder="(21) 98765-4321" 
                      maxLength={15}
                    />
                  </div>
                </div>

                {/* Subordinates Quick Action for Leadership */}
                {editForm.role !== 'CONSULTOR' && (
                  <div style={{ background: '#FAF8F5', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Users size={15} color="var(--primary-brown)" /> Liderados Diretos da Equipe
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {consultants.filter(c => c.reportsTo === editingConsultant.id).length} colaborador(es) reportam diretamente a este líder.
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                      onClick={() => {
                        setManagingSubordinatesLeader(editingConsultant);
                      }}
                    >
                      <Users size={13} /> Gerenciar Liderados
                    </button>
                  </div>
                )}

              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => handleDeleteConsultant(editingConsultant)}
                  style={{ color: '#991B1B', background: 'transparent', border: '1px solid #FECACA', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
                >
                  <Trash2 size={14} /> Excluir Membro
                </button>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setEditingConsultant(null)}>
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

      {/* =========================================================================
          MODAL DE ATRIBUIÇÃO DE CARTEIRA DE LOJAS (COM REGRA DE EXCLUSIVIDADE)
          ========================================================================= */}
      {managingConsultant && (
        <div className="modal-overlay" onClick={() => setManagingConsultant(null)}>
          <div className="modal-card" style={{ maxWidth: '850px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '1.75rem' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Carteira de Lojas Exclusiva</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Consultor(a): <strong style={{ color: 'var(--primary-brown)' }}>{managingConsultant.name}</strong> ({managingConsultant.region})
                </div>
              </div>
              <button className="modal-close" onClick={() => setManagingConsultant(null)}>
                <X size={20} />
              </button>
            </div>

            {/* Banner Informativo */}
            <div style={{ background: '#FAF8F5', border: '1px solid var(--border-subtle)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{assignedStoreIds.length}</strong> loja(s) selecionada(s) para este consultor.
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                  onClick={() => handleSelectAllAvailable(modalFilteredStores)}
                >
                  <CheckSquare size={13} /> Marcar Disponíveis
                </button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                  onClick={() => handleDeselectAllMine(modalFilteredStores)}
                >
                  <Square size={13} /> Desmarcar Minhas
                </button>
              </div>
            </div>

            {/* Barra de Filtros */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Buscar por nome, código RP ou cidade..."
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  style={{ paddingLeft: '2.2rem', fontSize: '0.82rem', width: '100%' }}
                />
              </div>

              <select 
                value={stateFilter} 
                onChange={(e) => setStateFilter(e.target.value)}
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
              >
                <option value="Todos">Todos os Estados</option>
                {Array.from(new Set(stores.map(s => s.state).filter(Boolean))).sort().map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>

              <select 
                value={availabilityFilter} 
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
              >
                <option value="Todas">Todas as Lojas</option>
                <option value="Deste Consultor">Deste Consultor</option>
                <option value="Disponíveis">Disponíveis (Sem consultor)</option>
                <option value="Outros Consultores">De Outros Consultores</option>
              </select>
            </div>

            {/* Checklist de Lojas com Scroll */}
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.5rem', maxHeight: '420px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.5rem' }}>
                {modalFilteredStores.map(store => {
                  const isChecked = assignedStoreIds.includes(store.id);
                  const belongsToOther = store.consultantId && store.consultantId !== managingConsultant.id && !isChecked;
                  const otherCons = belongsToOther ? consultants.find(c => c.id === store.consultantId) : null;

                  return (
                    <div 
                      key={store.id}
                      onClick={() => handleToggleStore(store)}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid',
                        borderColor: isChecked ? 'var(--primary-brown)' : 'var(--border-subtle)',
                        backgroundColor: isChecked ? 'var(--primary-brown-light)' : belongsToOther ? '#F9FAFB' : '#FFFFFF',
                        cursor: belongsToOther ? 'not-allowed' : 'pointer',
                        opacity: belongsToOther ? 0.75 : 1,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.6rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ marginTop: '2px' }}>
                        {isChecked ? (
                          <CheckCircle2 size={16} color="var(--primary-brown)" />
                        ) : belongsToOther ? (
                          <Lock size={15} color="#9CA3AF" />
                        ) : (
                          <Square size={16} color="var(--border-strong)" />
                        )}
                      </div>

                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isChecked ? 'var(--primary-brown)' : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {store.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                          Código RP: <strong>{store.code}</strong> &bull; {store.city}/{store.state}
                        </div>
                        {belongsToOther && (
                          <div style={{ fontSize: '0.68rem', color: '#6B7280', marginTop: '0.15rem', fontStyle: 'italic' }}>
                            🔒 {otherCons?.name || 'Outro consultor'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setManagingConsultant(null)}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" onClick={handleSaveAssignedStores}>
                Salvar Carteira de Lojas ({assignedStoreIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE GERENCIAMENTO DE REGIÕES OFICIAIS
          ========================================================================= */}
      {isRegionsModalOpen && (
        <div className="modal-overlay" onClick={() => setIsRegionsModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '650px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '1.75rem' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Gerenciador de Regiões Oficiais</h2>
              <button className="modal-close" onClick={() => setIsRegionsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Formulário de Nova Região */}
            <form onSubmit={handleAddNewRegion} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input 
                type="text" 
                placeholder="Nome da nova região..." 
                value={newRegionInput}
                onChange={(e) => setNewRegionInput(e.target.value)}
                style={{ flex: 1, fontSize: '0.85rem' }}
              />
              <button type="submit" className="btn-primary" style={{ fontSize: '0.85rem' }}>
                <Plus size={15} /> Adicionar Região
              </button>
            </form>

            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.5rem', maxHeight: '350px' }}>
              {availableRegions.map(regionName => {
                const isEditing = editingRegionOldName === regionName;
                const consultantsCount = consultants.filter(c => c.region === regionName).length;

                return (
                  <div 
                    key={regionName}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderBottom: '1px solid #F3F4F6',
                      background: isEditing ? '#FAF8F5' : '#FFFFFF'
                    }}
                  >
                    {isEditing ? (
                      <form onSubmit={handleSaveEditRegion} style={{ display: 'flex', gap: '0.5rem', flex: 1, marginRight: '0.5rem' }}>
                        <input 
                          type="text" 
                          value={editingRegionNewName}
                          onChange={(e) => setEditingRegionNewName(e.target.value)}
                          style={{ flex: 1, fontSize: '0.82rem' }}
                          autoFocus
                        />
                        <button type="submit" className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                          Salvar
                        </button>
                        <button type="button" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={() => setEditingRegionOldName(null)}>
                          Cancelar
                        </button>
                      </form>
                    ) : (
                      <>
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{regionName}</strong>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                            ({consultantsCount} membro{consultantsCount !== 1 ? 's' : ''})
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button 
                            type="button" 
                            className="btn-secondary" 
                            style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
                            onClick={() => handleStartEditRegion(regionName)}
                          >
                            <Edit3 size={13} />
                          </button>
                          <button 
                            type="button" 
                            className="btn-secondary" 
                            style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem', color: '#991B1B' }}
                            onClick={() => handleDeleteRegion(regionName)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn-primary" onClick={() => setIsRegionsModalOpen(false)}>
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE ZOOM DA FOTO DE PERFIL
          ========================================================================= */}
      {zoomedPhoto && (
        <div className="modal-overlay" onClick={() => setZoomedPhoto(null)} style={{ zIndex: 9999 }}>
          <div 
            className="modal-card" 
            style={{ 
              maxWidth: '440px', 
              padding: '1.75rem', 
              textAlign: 'center', 
              background: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
              position: 'relative'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="modal-close" 
              onClick={() => setZoomedPhoto(null)} 
              style={{ position: 'absolute', right: '1rem', top: '1rem' }}
              title="Fechar"
            >
              <X size={20} />
            </button>

            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: '0 0 0.25rem 0', fontWeight: 800 }}>
                {zoomedPhoto.name}
              </h3>
              <div style={{ fontSize: '0.82rem', color: 'var(--primary-brown)', fontWeight: 700, textTransform: 'uppercase' }}>
                {zoomedPhoto.role?.replace(/_/g, ' ')}
              </div>
            </div>

            <div style={{ 
              width: '280px', 
              height: '280px', 
              margin: '0 auto', 
              borderRadius: '50%', 
              overflow: 'hidden', 
              border: '4px solid var(--accent-gold)', 
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              backgroundColor: 'var(--primary-brown-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '4.5rem',
              fontWeight: 800,
              color: 'var(--primary-brown)'
            }}>
              {zoomedPhoto.url ? (
                <img 
                  src={zoomedPhoto.url} 
                  alt={zoomedPhoto.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                zoomedPhoto.name.split(' ').map(n => n[0]).slice(0, 2).join('')
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

    </div>
  );
}
