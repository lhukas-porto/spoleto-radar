import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
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
  UserCheck
} from 'lucide-react';

export default function NewVisitForm() {
  const { stores, consultants, categories, addVisit, setActiveTab, setSelectedVisitForReport } = useApp();

  // Store Combobox
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const storeDropdownRef = useRef(null);

  const [selectedConsultantId, setSelectedConsultantId] = useState(consultants[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [visitType, setVisitType] = useState('Visita agendada'); // 'Visita agendada' | 'Visita surpresa'
  const [generalNotes, setGeneralNotes] = useState('');

  // Dynamic Diagnostics List Builder
  const [diagnostics, setDiagnostics] = useState([
    {
      id: 'diag-' + Date.now(),
      categoryId: categories[0]?.id || 'cat-google',
      subproblemId: categories[0]?.subproblems[0]?.id || '',
      severity: categories[0]?.subproblems[0]?.defaultSeverity || 'Alta',
      notes: '',
      actionPlan: {
        action: categories[0]?.subproblems[0]?.suggestedActions?.[0] || '',
        responsible: 'GERENTE E EQUIPE',
        deadline: 'IMEDIATO',
        status: 'NÃO INICIADO'
      }
    }
  ]);

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

    const newVisit = {
      storeId: selectedStoreId,
      consultantId: selectedConsultantId,
      date,
      time,
      visitType,
      generalNotes,
      diagnostics: validDiagnostics
    };

    const savedVisit = addVisit(newVisit);
    setSelectedVisitForReport(savedVisit);
    setActiveTab('reports');
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Prancheta Digital de Visita de Negócios</h1>
          <p className="section-subtitle">Realize o diagnóstico operacional Spoleto e gere o Plano de Ação oficial da rede.</p>
        </div>
      </div>

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
                {consultants.map(cons => (
                  <option key={cons.id} value={cons.id}>
                    {cons.name} ({cons.region})
                  </option>
                ))}
              </select>
              <span className="form-help">Responsável técnico pela condução desta visita</span>
            </div>

            <div className="form-group">
              <label className="form-label">Data da Visita *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Horário de Início</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
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
                    backgroundColor: visitType === 'Visita agendada' ? '#FFFFFF' : 'transparent',
                    color: visitType === 'Visita agendada' ? 'var(--text-main)' : 'var(--text-secondary)',
                    boxShadow: visitType === 'Visita agendada' ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s ease'
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
                    transition: 'all 0.15s ease'
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
                <ClipboardCheck size={22} /> 2. Diagnóstico Operacional por Tema / Causa
              </h2>
              <p className="section-subtitle">
                Selecione o tema/causa principal e o subproblema correspondente. Adicione quantos problemas forem necessários.
              </p>
            </div>

            <button 
              type="button" 
              className="btn-primary"
              onClick={handleAddDiagnosticRow}
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem' }}
            >
              <Plus size={16} /> Adicionar Outro Problema
            </button>
          </div>

          {diagnostics.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', background: '#FAF8F5', borderRadius: 'var(--radius-lg)', border: '2px dashed var(--border-strong)' }}>
              <CheckCircle2 size={36} color="var(--success)" style={{ margin: '0 auto 0.5rem' }} />
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>Nenhum problema adicionado</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Se a loja apresentou não-conformidades no giro, clique no botão abaixo para adicionar.
              </p>
              <button type="button" className="btn-primary" onClick={handleAddDiagnosticRow}>
                <Plus size={16} /> Adicionar Problema
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
                        Problema #{index + 1}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveDiagnosticRow(diag.id)}
                        style={{ color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
                        title="Remover este problema"
                      >
                        <Trash2 size={15} /> Remover
                      </button>
                    </div>

                    <div className="form-grid" style={{ marginBottom: '0.75rem' }}>
                      {/* Seletor do Tema / Causa Principal */}
                      <div className="form-group">
                        <label className="form-label">Tema / Causa Principal *</label>
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

                      {/* Seletor do Subproblema Específico */}
                      <div className="form-group">
                        <label className="form-label">Subproblema Específico *</label>
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

                      {/* Severidade do Problema */}
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
                        <label className="form-label">Observações / Evidências da Visita</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Conforme combinamos em visita; nota atual 3.8; meta acima de 60%..."
                          value={diag.notes}
                          onChange={(e) => updateDiagField(diag.id, 'notes', e.target.value)}
                        />
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
                  <Plus size={16} /> Adicionar Outro Problema à Lista
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
                Para cada subproblema, você pode escolher uma das 3 sugestões oficiais ou editar livremente o texto da ação.
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
                          {sub?.title || 'Problema selecionado'}
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

        {/* Bloco 4: Parecer Geral */}
        <div className="card-panel">
          <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-brown)' }}>
            <FileCheck2 size={20} /> 4. Parecer Geral da Visita
          </h2>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Parecer do Consultor de Negócios</label>
            <textarea 
              rows="3"
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Resumo geral da postura da equipe, clima da loja, limpeza, atendimento e principais recomendações..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => setActiveTab('dashboard')}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}
            >
              <ClipboardCheck size={18} />
              Finalizar Visita & Gerar Laudo
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
