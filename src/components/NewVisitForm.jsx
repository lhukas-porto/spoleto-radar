import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import DateInput from './DateInput';
import SignaturePad from './SignaturePad';
import { 
  ClipboardCheck, 
  Store, 
  User, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Search,
  Check,
  X,
  Layers,
  AlertTriangle,
  Lightbulb,
  UserCheck,
  PenTool,
  ShieldCheck,
  Camera,
  ZoomIn,
  Image as ImageIcon
} from 'lucide-react';

export default function NewVisitForm() {
  const { 
    stores, 
    consultants, 
    categories, 
    addVisit, 
    updateVisit,
    editingVisit,
    cancelEditVisit,
    setActiveTab, 
    setSelectedVisitForReport, 
    showToast 
  } = useApp();

  // Store Combobox
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const storeDropdownRef = useRef(null);

  const businessConsultants = useMemo(() => {
    return consultants.filter(c => (c.role || 'CONSULTOR') === 'CONSULTOR');
  }, [consultants]);

  const [selectedConsultantId, setSelectedConsultantId] = useState(() => {
    return consultants.find(c => (c.role || 'CONSULTOR') === 'CONSULTOR')?.id || '';
  });
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [endTime, setEndTime] = useState('');
  const [visitType, setVisitType] = useState('Visita agendada'); // 'Visita agendada' | 'Visita surpresa'
  const [generalNotes, setGeneralNotes] = useState('');

  // Assinaturas Digitais Coletadas no Formulário
  const [storeSignature, setStoreSignature] = useState(null);
  const [storeSignerName, setStoreSignerName] = useState('');
  const [consultantSignature, setConsultantSignature] = useState(null);
  const [showSignatureSection, setShowSignatureSection] = useState(false);

  // Modal para ampliar foto
  const [zoomedPhoto, setZoomedPhoto] = useState(null);

  // Dynamic Diagnostics List Builder
  const [diagnostics, setDiagnostics] = useState([
    {
      id: 'diag-' + Date.now(),
      categoryId: categories[0]?.id || 'cat-google',
      subproblemId: categories[0]?.subproblems[0]?.id || '',
      severity: categories[0]?.subproblems[0]?.defaultSeverity || 'Alta',
      notes: '',
      photoUrl: null,
      actionPlan: {
        action: categories[0]?.subproblems[0]?.suggestedActions?.[0] || '',
        responsible: 'GERENTE E EQUIPE',
        deadline: 'IMEDIATO',
        status: 'NÃO INICIADO'
      }
    }
  ]);

  // Load existing visit data if editing
  useEffect(() => {
    if (editingVisit) {
      setSelectedStoreId(editingVisit.storeId || '');
      const st = stores.find(s => s.id === editingVisit.storeId);
      if (st) {
        setStoreSearchQuery(st.name + ' (' + st.city + '/' + st.state + ')');
      }
      setSelectedConsultantId(editingVisit.consultantId || consultants[0]?.id || '');
      setDate(editingVisit.date || new Date().toISOString().split('T')[0]);
      setTime(editingVisit.time || new Date().toTimeString().slice(0, 5));
      setEndTime(editingVisit.endTime || '');
      setVisitType(editingVisit.visitType || 'Visita agendada');
      setGeneralNotes(editingVisit.generalNotes || '');
      if (editingVisit.diagnostics && editingVisit.diagnostics.length > 0) {
        setDiagnostics(editingVisit.diagnostics);
      }
      if (editingVisit.signatures) {
        setStoreSignature(editingVisit.signatures.storeImg || null);
        setStoreSignerName(editingVisit.signatures.storeSignerName || '');
        setConsultantSignature(editingVisit.signatures.consultantImg || null);
        setShowSignatureSection(true);
      }
    }
  }, [editingVisit, stores, consultants]);

  // Filter stores
  const filteredStores = stores.filter(st => {
    const q = storeSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return st.name.toLowerCase().includes(q) ||
           st.code.toLowerCase().includes(q) ||
           st.city.toLowerCase().includes(q) ||
           st.state.toLowerCase().includes(q);
  });

  const selectedStore = stores.find(s => s.id === selectedStoreId);

  // Close store dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(event.target)) {
        setIsStoreDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStore = (store) => {
    setSelectedStoreId(store.id);
    setStoreSearchQuery(store.name + ' (' + store.city + '/' + store.state + ')');
    setIsStoreDropdownOpen(false);

    const matchedCons = consultants.find(c => 
      c.id === store.consultantId || 
      (c.assignedStores && Array.isArray(c.assignedStores) && c.assignedStores.includes(store.id))
    );

    if (matchedCons) {
      setSelectedConsultantId(matchedCons.id);
    }
  };

  const handleClearStore = () => {
    setSelectedStoreId('');
    setStoreSearchQuery('');
    setIsStoreDropdownOpen(true);
  };

  const handleAddDiagnosticRow = () => {
    const firstCat = categories[0];
    const firstSub = firstCat?.subproblems[0];

    const newRow = {
      id: 'diag-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      categoryId: firstCat?.id || '',
      subproblemId: firstSub?.id || '',
      severity: firstSub?.defaultSeverity || 'Alta',
      notes: '',
      photoUrl: null,
      actionPlan: {
        action: firstSub?.suggestedActions?.[0] || 'Definir plano de ação corretivo.',
        responsible: 'GERENTE E EQUIPE',
        deadline: 'IMEDIATO',
        status: 'NÃO INICIADO'
      }
    };

    setDiagnostics(prev => [...prev, newRow]);
  };

  const handleRemoveDiagnosticRow = (diagId) => {
    setDiagnostics(prev => prev.filter(d => d.id !== diagId));
  };

  // Upload e Compressão de Foto da Não Conformidade
  const handlePhotoUpload = (diagId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.78);
        updateDiagField(diagId, 'photoUrl', compressedBase64);
        if (showToast) {
          showToast('📷 Foto do problema anexada com sucesso!');
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (diagId) => {
    updateDiagField(diagId, 'photoUrl', null);
  };

  const handleCategoryChange = (diagId, newCatId) => {
    const targetCat = categories.find(c => c.id === newCatId);
    const firstSub = targetCat?.subproblems[0];

    setDiagnostics(prev => prev.map(d => {
      if (d.id !== diagId) return d;
      return {
        ...d,
        categoryId: newCatId,
        subproblemId: firstSub?.id || '',
        severity: firstSub?.defaultSeverity || 'Alta',
        actionPlan: {
          ...d.actionPlan,
          action: firstSub?.suggestedActions?.[0] || d.actionPlan.action
        }
      };
    }));
  };

  const handleSubproblemChange = (diagId, newSubId) => {
    setDiagnostics(prev => prev.map(d => {
      if (d.id !== diagId) return d;
      const targetCat = categories.find(c => c.id === d.categoryId);
      const sub = targetCat?.subproblems.find(s => s.id === newSubId);

      return {
        ...d,
        subproblemId: newSubId,
        severity: sub?.defaultSeverity || d.severity,
        actionPlan: {
          ...d.actionPlan,
          action: sub?.suggestedActions?.[0] || d.actionPlan.action
        }
      };
    }));
  };

  const updateDiagField = (diagId, field, value) => {
    setDiagnostics(prev => prev.map(d => {
      if (d.id !== diagId) return d;
      return { ...d, [field]: value };
    }));
  };

  const updateActionPlanField = (diagId, field, value) => {
    setDiagnostics(prev => prev.map(d => {
      if (d.id !== diagId) return d;
      return {
        ...d,
        actionPlan: {
          ...d.actionPlan,
          [field]: value
        }
      };
    }));
  };

  const setSuggestedAction = (diagId, actionText) => {
    updateActionPlanField(diagId, 'action', actionText);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedStoreId) {
      alert('Por favor, selecione a loja Spoleto auditada.');
      return;
    }

    if (!selectedConsultantId) {
      alert('Por favor, selecione o consultor responsável.');
      return;
    }

    const validDiagnostics = diagnostics.filter(d => d.categoryId && d.subproblemId);

    const hasSignatures = storeSignature || consultantSignature;
    const currentConsultant = consultants.find(c => c.id === selectedConsultantId);

    // Preenche automaticamente o horário de término com a hora do momento exato da finalização
    const now = new Date();
    const currentTimeFormatted = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const finalEndTime = (endTime && endTime.trim() !== '') ? endTime.trim() : currentTimeFormatted;

    const visitPayload = {
      storeId: selectedStoreId,
      consultantId: selectedConsultantId,
      date,
      time,
      endTime: finalEndTime,
      visitType,
      generalNotes,
      diagnostics: validDiagnostics,
      signatures: hasSignatures ? {
        consultantImg: consultantSignature,
        consultantName: currentConsultant?.name || 'Consultor(a) de Negócios',
        storeImg: storeSignature,
        storeSignerName: storeSignerName || 'Gerência da Loja',
        signedAt: new Date().toISOString()
      } : null
    };

    if (editingVisit) {
      updateVisit(editingVisit.id, visitPayload);
      setActiveTab('reports');
    } else {
      const savedVisit = addVisit(visitPayload);
      setSelectedVisitForReport(savedVisit);
      setActiveTab('reports');
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">
            {editingVisit ? 'Editar Relatório de Visita' : 'Visita de Consultoria'}
          </h1>
          <p className="section-subtitle">
            {editingVisit 
              ? 'Atualize os dados, diagnósticos e planos de ação desta visita operacional.' 
              : 'Realize o diagnóstico operacional Spoleto e gere o Plano de Ação oficial da rede.'}
          </p>
        </div>

        {editingVisit && (
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={cancelEditVisit}
            style={{ fontSize: '0.82rem' }}
          >
            <X size={15} /> Cancelar Edição
          </button>
        )}
      </div>

      {editingVisit && (
        <div style={{
          background: 'linear-gradient(135deg, #FEF9C3 0%, #FEF08A 100%)',
          border: '1.5px solid #FACC15',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: '0 2px 5px rgba(133, 77, 14, 0.08)'
        }}>
          <div>
            <strong style={{ color: '#854D0E', fontSize: '0.92rem' }}>
              ✏️ Modo de Edição Ativo
            </strong>
            <div style={{ fontSize: '0.78rem', color: '#713F12', marginTop: '0.15rem' }}>
              Editando visita da unidade <strong>{selectedStore?.name || 'Spoleto'}</strong> realizada em {editingVisit.date}.
            </div>
          </div>

          <button 
            type="button" 
            className="btn-secondary"
            onClick={cancelEditVisit}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', backgroundColor: '#FFFFFF' }}
          >
            Voltar sem Salvar
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Bloco 1: Identificação */}
        <div className="card-panel">
          <h2 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-brown)' }}>
            <Store size={20} /> 1. Identificação da Loja e Consultor
          </h2>

          <div className="form-grid">
            {/* Searchable Combobox for Store */}
            <div className="form-group" style={{ position: 'relative' }} ref={storeDropdownRef}>
              <label className="form-label">
                Loja Spoleto * <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(digite para buscar ou clique para listar)</span>
              </label>
              
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input 
                  type="text"
                  placeholder="Comece a digitar o nome da loja ou shopping..."
                  value={storeSearchQuery}
                  onChange={(e) => {
                    setStoreSearchQuery(e.target.value);
                    setIsStoreDropdownOpen(true);
                    if (selectedStoreId) setSelectedStoreId('');
                  }}
                  onFocus={() => setIsStoreDropdownOpen(true)}
                  style={{
                    width: '100%',
                    paddingLeft: '2.4rem',
                    paddingRight: selectedStoreId ? '2.4rem' : '1rem',
                    borderColor: selectedStoreId ? 'var(--primary-brown)' : 'var(--border-subtle)',
                    background: selectedStoreId ? 'var(--primary-brown-light)' : '#FFFFFF',
                    fontWeight: selectedStoreId ? 700 : 500
                  }}
                  required={!selectedStoreId}
                />
                {selectedStoreId && (
                  <button 
                    type="button" 
                    onClick={handleClearStore}
                    style={{ position: 'absolute', right: '10px', color: 'var(--text-muted)', padding: '4px' }}
                    title="Trocar loja"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Dropdown List */}
              {isStoreDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '100%',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  background: '#FFFFFF',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 50,
                  marginTop: '4px'
                }}>
                  {filteredStores.length === 0 ? (
                    <div style={{ padding: '0.85rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Nenhuma loja Spoleto encontrada com esse nome.
                    </div>
                  ) : (
                    filteredStores.slice(0, 50).map(store => {
                      const isSelected = store.id === selectedStoreId;

                      return (
                        <div 
                          key={store.id}
                          onClick={() => handleSelectStore(store)}
                          style={{
                            padding: '0.75rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border-subtle)',
                            backgroundColor: isSelected ? 'var(--primary-brown-light)' : '#FFFFFF',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = '#FAF8F5';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = '#FFFFFF';
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '0.9rem', color: isSelected ? 'var(--primary-brown)' : 'var(--text-main)', display: 'block' }}>
                              [{store.code}] {store.name}
                            </strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {store.city} - {store.state} &bull; {store.locationType}
                            </span>
                          </div>
                          {isSelected && <Check size={16} color="var(--primary-brown)" />}
                        </div>
                      );
                    })
                  )}
                  {filteredStores.length > 50 && (
                    <div style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', background: '#FAF8F5' }}>
                      Mostrando as primeiras 50 de {filteredStores.length} lojas. Digite mais letras para refinar.
                    </div>
                  )}
                </div>
              )}

              {selectedStore && (
                <span className="form-help" style={{ color: 'var(--primary-brown)', fontWeight: 600, marginTop: '0.3rem' }}>
                  ✓ Selecionada: {selectedStore.name} ({selectedStore.city}/{selectedStore.state})
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Consultor(a) Responsável *</label>
              <select value={selectedConsultantId} onChange={(e) => setSelectedConsultantId(e.target.value)} required>
                {businessConsultants.map(cons => (
                  <option key={cons.id} value={cons.id}>
                    {cons.name} ({cons.region})
                  </option>
                ))}
              </select>
              <span className="form-help">Responsável técnico pela condução desta visita</span>
            </div>

            <div className="form-group">
              <label className="form-label">Data da Visita *</label>
              <DateInput value={date} onChange={setDate} required />
            </div>

            <div className="form-group">
              <label className="form-label">Horário de Início</label>
              <input 
                type="time" 
                value={time} 
                onChange={(e) => setTime(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ margin: 0 }}>Horário de Fim (Término)</label>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const cur = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
                    setEndTime(cur);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-brown)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0
                  }}
                >
                  ⏱️ Agora
                </button>
              </div>
              <input 
                type="time" 
                value={endTime} 
                onChange={(e) => setEndTime(e.target.value)} 
                placeholder="--:--"
              />
              <span className="form-help">Preenchido automaticamente ao finalizar a visita</span>
            </div>

            {/* Compact Tipo de Visita Pill Toggle */}
            <div className="form-group" style={{ maxWidth: '280px' }}>
              <label className="form-label">Tipo de Visita *</label>
              <div style={{ display: 'flex', gap: '0.35rem', background: '#F5F1EB', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setVisitType('Visita agendada')}
                  style={{
                    flex: 1,
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: visitType === 'Visita agendada' ? 700 : 500,
                    backgroundColor: visitType === 'Visita agendada' ? 'var(--primary-brown)' : 'transparent',
                    color: visitType === 'Visita agendada' ? '#FFFFFF' : 'var(--text-secondary)',
                    boxShadow: visitType === 'Visita agendada' ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s ease',
                    cursor: 'pointer'
                  }}
                >
                  Visita agendada
                </button>
                <button
                  type="button"
                  onClick={() => setVisitType('Visita surpresa')}
                  style={{
                    flex: 1,
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: visitType === 'Visita surpresa' ? 700 : 500,
                    backgroundColor: visitType === 'Visita surpresa' ? 'var(--primary-brown)' : 'transparent',
                    color: visitType === 'Visita surpresa' ? '#FFFFFF' : 'var(--text-secondary)',
                    boxShadow: visitType === 'Visita surpresa' ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s ease',
                    cursor: 'pointer'
                  }}
                >
                  Visita surpresa
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 2: Diagnóstico Operacional por Lista Dinâmica */}
        <div className="card-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-brown)' }}>
                <ClipboardCheck size={22} /> 2. Diagnóstico Operacional por Tópico / Causa
              </h2>
              <p className="section-subtitle">
                Selecione o tópico/causa principal e o subtópico correspondente. Adicione quantos tópicos forem necessários.
              </p>
            </div>

            <button 
              type="button" 
              className="btn-primary"
              onClick={handleAddDiagnosticRow}
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem' }}
            >
              <Plus size={16} /> Adicionar Outro Tópico
            </button>
          </div>

          {diagnostics.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', background: '#FAF8F5', borderRadius: 'var(--radius-lg)', border: '2px dashed var(--border-strong)' }}>
              <CheckCircle2 size={36} color="var(--success)" style={{ margin: '0 auto 0.5rem' }} />
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>Nenhum tópico adicionado</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Se a loja apresentou não-conformidades no giro, clique no botão abaixo para adicionar.
              </p>
              <button type="button" className="btn-primary" onClick={handleAddDiagnosticRow}>
                <Plus size={16} /> Adicionar Tópico
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {diagnostics.map((diag, index) => {
                const currentCategory = categories.find(c => c.id === diag.categoryId);
                const currentSubproblems = currentCategory ? currentCategory.subproblems : [];
                const currentSubproblem = currentSubproblems.find(s => s.id === diag.subproblemId) || currentSubproblems[0];

                return (
                  <div 
                    key={diag.id}
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.35rem',
                      background: '#FFFFFF',
                      boxShadow: 'var(--shadow-sm)',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #F0ECE6', paddingBottom: '0.6rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary-brown)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Tópico #{index + 1}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveDiagnosticRow(diag.id)}
                        style={{ color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
                        title="Remover este tópico"
                      >
                        <Trash2 size={15} /> Remover
                      </button>
                    </div>

                    <div className="form-grid" style={{ marginBottom: '0.75rem' }}>
                      {/* Seletor do Tópico / Causa Principal */}
                      <div className="form-group">
                        <label className="form-label">Tópico / Causa Principal *</label>
                        <select 
                          value={diag.categoryId} 
                          onChange={(e) => handleCategoryChange(diag.id, e.target.value)}
                          style={{ fontWeight: 700 }}
                          required
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        <span className="form-help">Ex: GOOGLE, PLATAFORMA DO PRATO, FIDELIDADE, TEMPOS, DELIVERY...</span>
                      </div>

                      {/* Seletor do Subtópico Específico */}
                      <div className="form-group">
                        <label className="form-label">Subtópico Específico *</label>
                        <select 
                          value={diag.subproblemId} 
                          onChange={(e) => handleSubproblemChange(diag.id, e.target.value)}
                          style={{ fontWeight: 600 }}
                          required
                        >
                          {currentSubproblems.map(sub => (
                            <option key={sub.id} value={sub.id}>
                              {sub.title} ({sub.defaultSeverity})
                            </option>
                          ))}
                        </select>
                        <span className="form-help">Escolha o diagnóstico exato verificado na loja</span>
                      </div>

                      {/* Severidade do Tópico */}
                      <div className="form-group">
                        <label className="form-label">Grau de Severidade</label>
                        <select 
                          value={diag.severity} 
                          onChange={(e) => updateDiagField(diag.id, 'severity', e.target.value)}
                          style={{ fontWeight: 600 }}
                        >
                          <option value="Leve">Leve (Pequeno ajuste)</option>
                          <option value="Média">Média (Impacto moderado)</option>
                          <option value="Alta">Alta (Gargalo de pico / padrão)</option>
                          <option value="Crítica">Crítica (Risco imediato / cancelamentos)</option>
                        </select>
                      </div>

                      {/* Observações de Campo */}
                      <div className="form-group">
                        <label className="form-label">Observações / Detalhes</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Conforme combinamos em visita; nota atual 3.8; meta acima de 60%..."
                          value={diag.notes}
                          onChange={(e) => updateDiagField(diag.id, 'notes', e.target.value)}
                        />
                      </div>

                      {/* Campo de Anexo de Foto de Evidência / Não Conformidade */}
                      <div className="form-group" style={{ gridColumn: '1 / -1', borderTop: '1px dashed #E8DFD8', paddingTop: '0.85rem', marginTop: '0.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary-brown)', fontWeight: 700, margin: 0 }}>
                            <Camera size={15} color="var(--accent-gold-dark)" /> Foto do Problema / Não Conformidade (Opcional)
                          </label>
                          {diag.photoUrl && (
                            <span style={{ fontSize: '0.72rem', color: '#166534', background: '#DCFCE7', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                              Foto Anexada ✅
                            </span>
                          )}
                        </div>

                        {diag.photoUrl ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#FAF8F5', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #E8DFD8', flexWrap: 'wrap' }}>
                            <img 
                              src={diag.photoUrl} 
                              alt="Foto da Não Conformidade" 
                              onClick={() => setZoomedPhoto(diag.photoUrl)}
                              style={{ width: '68px', height: '68px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '2px solid #5D3826', cursor: 'pointer' }}
                              title="Clique para ampliar a foto"
                            />
                            <div style={{ flex: 1, minWidth: '180px' }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <CheckCircle2 size={15} color="#16A34A" /> Evidência fotográfica registrada
                              </div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                Esta foto será incluída no Laudo Oficial e no PDF emitido.
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                type="button"
                                onClick={() => setZoomedPhoto(diag.photoUrl)}
                                className="btn-secondary"
                                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                              >
                                <ZoomIn size={14} /> Ampliar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(diag.id)}
                                style={{ color: '#EF4444', background: '#FEE2E2', border: '1px solid #FCA5A5', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}
                              >
                                <Trash2 size={14} /> Remover
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label 
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.55rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1.5px dashed #C8102E',
                                background: '#FFF8F8',
                                color: '#C8102E',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              <Camera size={16} /> 📷 Tirar Foto com a Câmera ou Selecionar Arquivo
                              <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment"
                                style={{ display: 'none' }}
                                onChange={(e) => handlePhotoUpload(diag.id, e)}
                              />
                            </label>
                            <span className="form-help" style={{ display: 'block', marginTop: '0.35rem' }}>
                              Ex: Foto do equipamento quebrado, painel de temperos fora do padrão, falta de pagers, etc.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={handleAddDiagnosticRow}
                  style={{ borderStyle: 'dashed', padding: '0.7rem 1.5rem' }}
                >
                  <Plus size={16} /> Adicionar Outro Tópico à Lista
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bloco 3: Planos de Ação Oficiais com 3 Sugestões Rápidas */}
        {diagnostics.length > 0 && (
          <div className="card-panel" style={{ border: '1px solid var(--primary-brown-border)' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-brown)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Sparkles size={16} /> Plano de Ação Oficial Spoleto
              </div>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>
                3. Detalhamento de Ações a serem executadas e acompanhadas
              </h2>
              <p className="section-subtitle">
                Para cada subtópico, você pode escolher uma das 3 sugestões oficiais ou editar livremente o texto da ação.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {diagnostics.map((diag, index) => {
                const category = categories.find(c => c.id === diag.categoryId);
                const sub = category?.subproblems.find(s => s.id === diag.subproblemId);
                const suggestions = sub?.suggestedActions || [];

                return (
                  <div 
                    key={diag.id}
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.35rem',
                      background: 'var(--bg-card)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                          Item #{index + 1} &bull; {category?.name}
                        </div>
                        <h4 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                          {sub?.title || 'Tópico selecionado'}
                        </h4>
                      </div>

                      <span className={`badge ${diag.severity === 'Crítica' ? 'badge-critica' : diag.severity === 'Alta' ? 'badge-alta' : 'badge-media'}`}>
                        {diag.severity}
                      </span>
                    </div>

                    {/* 3 Sugestões Rápidas de Plano de Ação */}
                    {suggestions.length > 0 && (
                      <div style={{ marginBottom: '1rem', background: '#FAF8F5', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Lightbulb size={14} color="var(--accent-gold-dark)" /> 3 Planos de Ação Sugeridos (clique para aplicar):
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {suggestions.map((sug, sIdx) => {
                            const isCurrent = diag.actionPlan.action === sug;

                            return (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => setSuggestedAction(diag.id, sug)}
                                style={{
                                  textAlign: 'left',
                                  padding: '0.45rem 0.75rem',
                                  borderRadius: 'var(--radius-sm)',
                                  fontSize: '0.82rem',
                                  backgroundColor: isCurrent ? 'var(--primary-brown-light)' : '#FFFFFF',
                                  color: isCurrent ? 'var(--primary-brown)' : 'var(--text-main)',
                                  border: isCurrent ? '1px solid var(--primary-brown)' : '1px solid var(--border-subtle)',
                                  fontWeight: isCurrent ? 700 : 500,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '0.5rem',
                                  cursor: 'pointer'
                                }}
                              >
                                <span><strong>Opção {sIdx + 1}:</strong> {sug}</span>
                                {isCurrent && <Check size={14} color="var(--primary-brown)" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="form-grid" style={{ marginBottom: '0.75rem' }}>
                      {/* Campo Ação (Editável) */}
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Ação a ser executada *</label>
                        <textarea 
                          rows="2"
                          value={diag.actionPlan.action}
                          onChange={(e) => updateActionPlanField(diag.id, 'action', e.target.value)}
                          required
                          placeholder="Descreva a ação corretiva a ser implementada na loja..."
                        />
                      </div>

                      {/* Quem (Responsável Spoleto) */}
                      <div className="form-group">
                        <label className="form-label">Quem (Responsável) *</label>
                        <select 
                          value={diag.actionPlan.responsible}
                          onChange={(e) => updateActionPlanField(diag.id, 'responsible', e.target.value)}
                          style={{ fontWeight: 600 }}
                        >
                          <option value="GERENTE E EQUIPE">GERENTE E EQUIPE</option>
                          <option value="FRANQUEADO">FRANQUEADO</option>
                          <option value="GERENTE E FRANQUEADO">GERENTE E FRANQUEADO</option>
                          <option value="COLABORADORES">COLABORADORES</option>
                          <option value="EMBAIXADOR">EMBAIXADOR</option>
                          <option value="GERENTE">GERENTE</option>
                          <option value="CONSULTOR">CONSULTOR</option>
                          <option value="ÁREAS INTERNAS DA FRANQUEADORA">ÁREAS INTERNAS DA FRANQUEADORA</option>
                        </select>
                      </div>

                      {/* Prazo */}
                      <div className="form-group">
                        <label className="form-label">Prazo *</label>
                        <select 
                          value={diag.actionPlan.deadline}
                          onChange={(e) => updateActionPlanField(diag.id, 'deadline', e.target.value)}
                          style={{ fontWeight: 600 }}
                        >
                          <option value="IMEDIATO">IMEDIATO</option>
                          <option value="7 dias">7 dias</option>
                          <option value="15 dias">15 dias</option>
                          <option value="30 dias">30 dias</option>
                          <option value="Próxima Visita">Próxima Visita</option>
                        </select>
                      </div>

                      {/* Status */}
                      <div className="form-group">
                        <label className="form-label">Status *</label>
                        <select 
                          value={diag.actionPlan.status}
                          onChange={(e) => updateActionPlanField(diag.id, 'status', e.target.value)}
                          style={{
                            fontWeight: 700,
                            backgroundColor: diag.actionPlan.status === 'CONCLUÍDO' ? 'var(--success-light)' : diag.actionPlan.status === 'EM ANDAMENTO' ? 'var(--warning-light)' : 'var(--danger-light)',
                            color: diag.actionPlan.status === 'CONCLUÍDO' ? 'var(--success)' : diag.actionPlan.status === 'EM ANDAMENTO' ? 'var(--warning)' : 'var(--danger)'
                          }}
                        >
                          <option value="NÃO INICIADO">NÃO INICIADO</option>
                          <option value="EM ANDAMENTO">EM ANDAMENTO</option>
                          <option value="CONCLUÍDO">CONCLUÍDO</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bloco 4: Diagnóstico Geral */}
        <div className="card-panel">
          <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-brown)' }}>
            <FileCheck2 size={20} /> 4. Diagnóstico Geral da Visita
          </h2>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Diagnóstico do Consultor de Negócios</label>
            <textarea 
              rows="3"
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Resumo geral da postura da equipe, clima da loja, limpeza, atendimento e principais recomendações..."
            />
          </div>

          {/* Bloco 5: Assinatura Digital do Laudo (Opcional) */}
          <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem', borderTop: '1px solid #E8DFD8', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--primary-brown)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <PenTool size={18} color="var(--accent-gold-dark)" /> 5. Coleta de Assinatura Digital (Opcional)
                </h3>
                <p className="section-subtitle">
                  Você pode coletar a assinatura da gerência agora ou a qualquer momento após gerar o laudo.
                </p>
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowSignatureSection(prev => !prev)}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                {showSignatureSection ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                {showSignatureSection ? 'Ocultar Quadros de Assinatura' : storeSignature || consultantSignature ? 'Ver Assinaturas Coletadas ✅' : '+ Abrir Quadros de Assinatura'}
              </button>
            </div>

            {showSignatureSection && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', background: '#FFFFFF', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                {/* Assinatura da Loja */}
                <SignaturePad
                  value={storeSignature}
                  onChange={setStoreSignature}
                  title="Assinatura do Franqueado / Gerente"
                  subtitle="Passe o celular/tablet para o responsável assinar"
                  signerName={storeSignerName}
                  onSignerNameChange={setStoreSignerName}
                  signerNameLabel="Nome de quem está recebendo a consultoria"
                  signerRole="Responsável pela Unidade Spoleto"
                  height={150}
                />

                {/* Assinatura do Consultor */}
                <SignaturePad
                  value={consultantSignature}
                  onChange={setConsultantSignature}
                  title="Assinatura do Consultor(a)"
                  subtitle="Rubrica do consultor de negócios Spoleto"
                  signerRole="Consultor(a) de Negócios Spoleto"
                  height={150}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button 
              type="button" 
              className="btn-secondary"
              onClick={editingVisit ? cancelEditVisit : () => setActiveTab('dashboard')}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}
            >
              <ClipboardCheck size={18} />
              {editingVisit ? 'Salvar Alterações da Visita' : 'Finalizar Visita & Gerar Laudo'}
            </button>
          </div>
        </div>
      </form>

      {/* Modal Lightbox para Ampliar Foto */}
      {zoomedPhoto && (
        <div 
          className="modal-overlay" 
          onClick={() => setZoomedPhoto(null)} 
          style={{ zIndex: 9999, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)' }}
        >
          <div 
            className="modal-card" 
            style={{ maxWidth: '850px', padding: '1rem', background: '#1E293B', border: '1px solid #334155', textAlign: 'center' }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#F8FAFC', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Camera size={16} color="var(--accent-gold)" /> Evidência Fotográfica da Não Conformidade
              </span>
              <button 
                type="button" 
                onClick={() => setZoomedPhoto(null)} 
                style={{ color: '#94A3B8', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
              >
                <X size={22} />
              </button>
            </div>
            <img 
              src={zoomedPhoto} 
              alt="Evidência Ampliada" 
              style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
