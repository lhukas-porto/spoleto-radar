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
  Sparkles,
  Eye,
  Camera,
  Sliders
} from 'lucide-react';
import AvatarCropModal from './AvatarCropModal';

export default function FranchiseesView() {
  const { 
    franchisees, 
    franchiseeGroups = [],
    stores, 
    addFranchisee, 
    updateFranchisee, 
    deleteFranchisee, 
    setSelectedStoreForProfile,
    selectedFranchiseeForProfile,
    setSelectedFranchiseeForProfile,
    isAdminUnlocked,
    hasPermission
  } = useApp();

  const canAddOrEditFranchisee = isAdminUnlocked || hasPermission('add_franchisee');

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFranchisee, setEditingFranchisee] = useState(null);
  const [zoomedPhoto, setZoomedPhoto] = useState(null);
  const [imageToCrop, setImageToCrop] = useState(null);

  // Handlers para corte e reposicionamento com zoom da foto
  const handleFileSelect = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageToCrop({ src: e.target.result });
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmCrop = (croppedUrl) => {
    setFormData(prev => ({ ...prev, photoUrl: croppedUrl }));
    setImageToCrop(null);
  };

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    photoUrl: null,
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
      photoUrl: null,
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
      email: (fran.email || '').includes(',') ? fran.email.split(',')[0].trim() : (fran.email || ''),
      phone: fran.phone || '',
      photoUrl: fran.photoUrl || null,
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

    const formatted = {
      ...formData,
      name: formData.name.toUpperCase().trim(),
      email: (formData.email || '').toLowerCase().trim(),
      phone: formatPhoneNumber(formData.phone)
    };

    if (editingFranchisee) {
      updateFranchisee(editingFranchisee.id, formatted);
    } else {
      addFranchisee(formatted);
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

  // KPI Calculations Inteligentes (Agrupamento por Loja / Sociedade)
  const totalPartners = franchisees.length;
  const totalFranchiseeGroups = (franchiseeGroups && franchiseeGroups.length > 0)
    ? franchiseeGroups.length
    : franchisees.length;
  const totalFranchisees = totalFranchiseeGroups;
  const multiUnitCount = (franchiseeGroups && franchiseeGroups.length > 0)
    ? franchiseeGroups.filter(g => g.storeCount > 1).length
    : franchisees.filter(f => (f.assignedStoreIds || []).length > 1).length;
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

        {canAddOrEditFranchisee && (
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Cadastrar Novo Franqueado
          </button>
        )}
      </div>

      {/* Mini KPIs de Franqueados (Consolidados por Grupo / Operação) */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: 'var(--primary-brown-light)', color: 'var(--primary-brown)' }}>
            <Users size={22} />
          </div>
          <div>
            <div className="kpi-label">Franqueados da Rede</div>
            <div className="kpi-value" style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem' }}>
              <span>{totalFranchisees}</span>
              {totalPartners > totalFranchisees && (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                  ({totalPartners} sócios)
                </span>
              )}
            </div>
            <div className="kpi-subtext">
              {totalPartners > totalFranchisees 
                ? 'Grupos / Operadores consolidados' 
                : 'Parceiros de negócios da rede'}
            </div>
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
            const myGroup = (franchiseeGroups || []).find(g => g.partners.some(p => p.id === fran.id));
            const otherPartners = (myGroup?.partners || []).filter(p => p.id !== fran.id);

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
                      {/* Avatar do Franqueado com Zoom ao Clicar */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoomedPhoto({ 
                            url: fran.photoUrl || null, 
                            name: fran.name, 
                            role: 'SÓCIO FRANQUEADO SPOLETO' 
                          });
                        }}
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          border: fran.photoUrl ? '2px solid var(--accent-gold)' : '1.5px solid var(--border-subtle)',
                          overflow: 'hidden',
                          background: fran.photoUrl ? '#FFFFFF' : (isMultiUnit ? 'linear-gradient(135deg, #5D3826 0%, #B45309 100%)' : '#FAF8F5'),
                          color: isMultiUnit ? '#FFFFFF' : 'var(--primary-brown)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1.15rem',
                          cursor: 'pointer',
                          flexShrink: 0,
                          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                          transition: 'transform 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        title="Clique para ver a foto ampliada"
                      >
                        {fran.photoUrl ? (
                          <img src={fran.photoUrl} alt={fran.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          fran.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', margin: 0, fontWeight: 800 }}>
                          {fran.name}
                        </h3>
                        <span style={{ fontSize: '0.74rem', color: isMultiUnit ? '#B45309' : 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                          {isMultiUnit && <Sparkles size={11} color="#B45309" />}
                          {franStores.length} {franStores.length === 1 ? 'Loja sob gestão' : 'Lojas sob gestão'}
                        </span>
                        {otherPartners.length > 0 && (
                          <div style={{ marginTop: '0.25rem' }}>
                            <span 
                              style={{ 
                                fontSize: '0.68rem', 
                                backgroundColor: '#FEF3C7', 
                                color: '#92400E', 
                                padding: '0.12rem 0.45rem', 
                                borderRadius: 'var(--radius-full)', 
                                fontWeight: 700, 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.25rem' 
                              }}
                              title={`Sociedade compartilhada com: ${otherPartners.map(p => p.name).join(', ')}`}
                            >
                              👥 Sociedade ({otherPartners.length + 1} sócios)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedFranchiseeForProfile(fran)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--primary-brown)', cursor: 'pointer', padding: '0.3rem', borderRadius: '4px' }}
                        title="Abrir Ficha 360°"
                      >
                        <Eye size={15} />
                      </button>
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
                      {(() => {
                        const displayEmail = (fran.email || '').includes(',') ? fran.email.split(',')[0].trim() : (fran.email || '').trim();
                        return displayEmail ? (
                          <a 
                            href={`mailto:${displayEmail}`}
                            style={{ color: 'var(--primary-brown)', textDecoration: 'underline', fontWeight: 600, wordBreak: 'break-all' }}
                            title="Enviar e-mail direto para o Franqueado"
                          >
                            {displayEmail}
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>E-mail não cadastrado</span>
                        );
                      })()}
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

                {/* Ações do Card: Ficha 360° e Gerenciamento */}
                <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedFranchiseeForProfile(fran)}
                    style={{
                      padding: '0.45rem 0.65rem',
                      backgroundColor: '#FAF5EE',
                      border: '1.5px solid var(--primary-brown-light)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--primary-brown)',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--primary-brown)';
                      e.currentTarget.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#FAF5EE';
                      e.currentTarget.style.color = 'var(--primary-brown)';
                    }}
                    title={`Abrir Ficha 360° do Franqueado ${fran.name}`}
                  >
                    <Eye size={13} /> Ficha 360°
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleOpenEdit(fran)}
                    style={{ fontSize: '0.78rem', justifyContent: 'center', gap: '0.35rem' }}
                    title="Editar Cadastro e Vínculo de Lojas"
                  >
                    <Edit3 size={13} /> Editar / Lojas
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
        <div className="modal-backdrop">
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {editingFranchisee && (
                  <button
                    type="button"
                    onClick={() => setSelectedFranchiseeForProfile(editingFranchisee)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      backgroundColor: '#FAF5EE',
                      border: '1.5px solid var(--primary-brown-light)',
                      borderRadius: '6px',
                      color: 'var(--primary-brown)',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--primary-brown)';
                      e.currentTarget.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#FAF5EE';
                      e.currentTarget.style.color = 'var(--primary-brown)';
                    }}
                    title="Abrir Visão 360° deste franqueado"
                  >
                    <Eye size={13} /> Ficha 360°
                  </button>
                )}
                <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
                
                {/* Upload de Foto de Perfil com Corte e Zoom */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '0.85rem', background: '#FAF8F5', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-strong)' }}>
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
                    flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                  }}>
                    {formData.photoUrl ? (
                      <img src={formData.photoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Camera size={24} color="var(--text-muted)" />
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ marginBottom: '0.25rem', display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Foto de Perfil do Franqueado
                    </label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        handleFileSelect(e.target.files?.[0]);
                        e.target.value = '';
                      }}
                      style={{ fontSize: '0.8rem' }}
                    />
                    {formData.photoUrl && (
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.45rem', alignItems: 'center' }}>
                        <button 
                          type="button" 
                          onClick={() => setImageToCrop({ src: formData.photoUrl })}
                          style={{ fontSize: '0.74rem', color: 'var(--primary-brown)', background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '4px', cursor: 'pointer', padding: '0.25rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700 }}
                          title="Reposicionar ou dar zoom na foto"
                        >
                          <Sliders size={12} /> Ajustar Posição / Zoom
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setFormData(prev => ({ ...prev, photoUrl: null }))}
                          style={{ fontSize: '0.74rem', color: '#991B1B', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}
                        >
                          Remover Foto
                        </button>
                      </div>
                    )}
                  </div>
                </div>

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
              <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {editingFranchisee && (
                    <button 
                      type="button" 
                      className="btn-secondary"
                      onClick={() => setSelectedFranchiseeForProfile(editingFranchisee)}
                      style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary-brown)', borderColor: 'var(--primary-brown-light)', backgroundColor: '#FAF5EE', fontWeight: 700 }}
                    >
                      <Eye size={14} /> Ficha 360° do Franqueado
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    <Check size={16} /> {editingFranchisee ? 'Salvar Alterações' : 'Cadastrar Franqueado'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Foto Ampliada com Zoom Centralizado */}
      {zoomedPhoto && (
        <div 
          className="modal-backdrop" 
          onClick={() => setZoomedPhoto(null)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 10000,
            backgroundColor: 'rgba(0, 0, 0, 0.75)'
          }}
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: '380px', 
              padding: '2rem 1.5rem', 
              borderRadius: 'var(--radius-lg)', 
              textAlign: 'center',
              backgroundColor: '#FFFFFF',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}
          >
            <button 
              onClick={() => setZoomedPhoto(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: '0 0 0.25rem 0', fontWeight: 800 }}>
                {zoomedPhoto.name}
              </h3>
              <div style={{ fontSize: '0.82rem', color: 'var(--primary-brown)', fontWeight: 700, textTransform: 'uppercase' }}>
                {zoomedPhoto.role}
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

      {/* Modal Interativo de Corte e Posicionamento Circular da Foto */}
      {imageToCrop && (
        <AvatarCropModal
          imageSrc={imageToCrop.src}
          title="Ajustar Foto do Franqueado"
          subtitle="Arraste para posicionar e use o controle deslizante para dar zoom."
          onConfirm={handleConfirmCrop}
          onCancel={() => setImageToCrop(null)}
        />
      )}
    </div>
  );
}
