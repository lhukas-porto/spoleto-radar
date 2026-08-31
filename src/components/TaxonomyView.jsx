import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Settings2, 
  Plus, 
  AlertCircle, 
  ChevronRight, 
  Sparkles,
  X,
  Lightbulb,
  FolderPlus,
  Layers,
  Tag,
  CheckCircle2,
  Edit2,
  Trash2,
  Check
} from 'lucide-react';

export default function TaxonomyView() {
  const { 
    categories, 
    addCategory, 
    updateCategory, 
    deleteCategory, 
    addSubproblem, 
    updateSubproblem, 
    deleteSubproblem 
  } = useApp();

  const [selectedCatId, setSelectedCatId] = useState(categories[0]?.id || '');
  
  // Modals state
  const [isNewCatModalOpen, setIsNewCatModalOpen] = useState(false);
  const [isEditCatModalOpen, setIsEditCatModalOpen] = useState(false);
  const [isNewSubModalOpen, setIsNewSubModalOpen] = useState(false);
  const [editingSubproblem, setEditingSubproblem] = useState(null);

  // New Category Form State
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Edit Category Form State
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');

  // Subproblem Form State (New & Edit)
  const [subTitle, setSubTitle] = useState('');
  const [subSeverity, setSubSeverity] = useState('Alta');
  const [subAction1, setSubAction1] = useState('');
  const [subAction2, setSubAction2] = useState('');
  const [subAction3, setSubAction3] = useState('');

  const selectedCategory = categories.find(c => c.id === selectedCatId) || categories[0];

  // Open Edit Category Modal
  const handleOpenEditCategory = (cat) => {
    setEditCatName(cat.name);
    setEditCatDesc(cat.description || '');
    setIsEditCatModalOpen(true);
  };

  const handleSaveEditCategory = (e) => {
    e.preventDefault();
    if (!editCatName.trim()) {
      alert('Informe o nome do tema.');
      return;
    }
    updateCategory(selectedCategory.id, {
      name: editCatName,
      description: editCatDesc
    });
    setIsEditCatModalOpen(false);
  };

  const handleDeleteCategory = (catId, catName) => {
    if (confirm(`Tem certeza que deseja excluir o Tópico Principal "${catName}" e todos os seus subtópicos?`)) {
      deleteCategory(catId);
      const remaining = categories.filter(c => c.id !== catId);
      if (remaining.length > 0) {
        setSelectedCatId(remaining[0].id);
      }
    }
  };

  // Open Edit Subproblem Modal
  const handleOpenEditSubproblem = (sub) => {
    setEditingSubproblem(sub);
    setSubTitle(sub.title);
    setSubSeverity(sub.defaultSeverity || 'Alta');
    const actions = sub.suggestedActions || [sub.suggestedAction || ''];
    setSubAction1(actions[0] || '');
    setSubAction2(actions[1] || '');
    setSubAction3(actions[2] || '');
  };

  const handleSaveEditSubproblem = (e) => {
    e.preventDefault();
    if (!subTitle.trim()) {
      alert('Informe o título do subtópico.');
      return;
    }

    const actions = [subAction1, subAction2, subAction3].filter(a => a.trim().length > 0);

    updateSubproblem(selectedCategory.id, editingSubproblem.id, {
      title: subTitle,
      defaultSeverity: subSeverity,
      suggestedActions: actions.length > 0 ? actions : ['Definir ação corretiva na visita.']
    });

    setEditingSubproblem(null);
  };

  const handleDeleteSubproblem = (subId, title) => {
    if (confirm(`Deseja remover o subtópico "${title}"?`)) {
      deleteSubproblem(selectedCategory.id, subId);
    }
  };

  // Save New Subproblem
  const handleSaveNewSubproblem = (e) => {
    e.preventDefault();
    if (!subTitle.trim()) {
      alert('Informe o título do subtópico.');
      return;
    }

    const actions = [subAction1, subAction2, subAction3].filter(a => a.trim().length > 0);

    addSubproblem(selectedCatId, subTitle, subSeverity, actions[0] || 'Ação a definir');

    if (actions.length > 1) {
      // update with full 3 actions
      setTimeout(() => {
        const cat = categories.find(c => c.id === selectedCatId);
        const lastSub = cat?.subproblems[cat.subproblems.length - 1];
        if (lastSub) {
          updateSubproblem(selectedCatId, lastSub.id, {
            title: subTitle,
            defaultSeverity: subSeverity,
            suggestedActions: actions
          });
        }
      }, 50);
    }

    setIsNewSubModalOpen(false);
    setSubTitle('');
    setSubAction1('');
    setSubAction2('');
    setSubAction3('');
  };

  // Save New Category (Criar apenas com o nome)
  const handleSaveNewCategory = async (e) => {
    e.preventDefault();
    const trimmedName = catName.trim();
    if (!trimmedName) {
      alert('Informe o nome do tópico.');
      return;
    }
    const newCat = await addCategory({
      name: trimmedName,
      description: catDesc.trim() || `Tópico e causa operacional: ${trimmedName}`
    });
    if (newCat) {
      setSelectedCatId(newCat.id);
    }
    setIsNewCatModalOpen(false);
    setCatName('');
    setCatDesc('');
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Matriz de Tópicos & Planos de Ação Oficiais</h1>
          <p className="section-subtitle">Gerencie e edite os Tópicos Principais e Subtópicos com seus 3 Planos de Ação oficiais.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-primary" onClick={() => setIsNewCatModalOpen(true)}>
            <FolderPlus size={18} /> Novo Tópico Principal
          </button>
          <button className="btn-secondary" onClick={() => {
            setSubTitle('');
            setSubAction1('');
            setSubAction2('');
            setSubAction3('');
            setIsNewSubModalOpen(true);
          }}>
            <Plus size={18} /> Novo Subtópico
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
        
        {/* Lista Lateral de Tópicos Principais */}
        <div className="card-panel" style={{ padding: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Tópicos Principais ({categories.length})
            </span>
            <button 
              type="button" 
              onClick={() => setIsNewCatModalOpen(true)}
              style={{ color: 'var(--primary-brown)', fontSize: '0.78rem', fontWeight: 700 }}
            >
              + Adicionar
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '72vh', overflowY: 'auto' }}>
            {categories.map(cat => {
              const isSelected = selectedCatId === cat.id;

              return (
                <div
                  key={cat.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isSelected ? 'var(--primary-brown-light)' : 'transparent',
                    padding: '0.35rem 0.6rem',
                    border: isSelected ? '1px solid var(--primary-brown-border)' : '1px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedCatId(cat.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      fontWeight: isSelected ? 800 : 600,
                      color: isSelected ? 'var(--primary-brown)' : 'var(--text-main)',
                      flex: 1,
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 0.2rem'
                    }}
                  >
                    <span>{cat.name}</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.72rem', background: '#FFFFFF', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)', fontWeight: 700, color: 'var(--text-muted)' }}>
                      {cat.subproblems?.length || 0}
                    </span>

                    {/* Botão Editar Tópico */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditCategory(cat)}
                      style={{ color: 'var(--primary-brown)', padding: '4px', borderRadius: '4px' }}
                      title="Editar este Tópico Principal"
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detalhamento dos Subtópicos e Botões de Edição */}
        <div className="card-panel">
          {selectedCategory && (
            <div>
              {/* Header do Tópico Selecionado com Botão de Editar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--accent-gold-dark)', letterSpacing: '0.5px' }}>
                    Tópico Principal Selecionado
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.2rem' }}>
                    <h2 style={{ fontSize: '1.4rem', color: 'var(--primary-brown)' }}>
                      {selectedCategory.name}
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleOpenEditCategory(selectedCategory)}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                      title="Editar nome e descrição deste tópico"
                    >
                      <Edit2 size={13} /> Editar Tópico
                    </button>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {selectedCategory.description || 'Tópico e causa operacional da rede Spoleto.'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn-primary" 
                    style={{ fontSize: '0.82rem', padding: '0.5rem 0.9rem' }}
                    onClick={() => {
                      setSubTitle('');
                      setSubAction1('');
                      setSubAction2('');
                      setSubAction3('');
                      setIsNewSubModalOpen(true);
                    }}
                  >
                    <Plus size={15} /> Adicionar Subtópico
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(selectedCategory.id, selectedCategory.name)}
                    className="btn-secondary"
                    style={{ color: 'var(--status-nao-iniciado-text)', borderColor: '#FCA5A5', fontSize: '0.82rem', padding: '0.5rem 0.75rem' }}
                    title="Excluir este tópico principal"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Lista de Subtópicos com Ações de Edição */}
              {(!selectedCategory.subproblems || selectedCategory.subproblems.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: '#FAF8F5', borderRadius: 'var(--radius-md)', border: '2px dashed #D6C7B8' }}>
                  <FolderPlus size={42} color="var(--primary-brown)" style={{ margin: '0 auto 0.75rem', opacity: 0.8 }} />
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-brown)', marginBottom: '0.35rem', fontWeight: 800 }}>
                    Tópico "{selectedCategory.name}" criado!
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
                    Agora adicione os subtópicos com seus respectivos 3 planos de ação oficiais para completar a matriz.
                  </p>
                  <button 
                    type="button" 
                    className="btn-primary"
                    onClick={() => {
                      setSubTitle('');
                      setSubAction1('');
                      setSubAction2('');
                      setSubAction3('');
                      setIsNewSubModalOpen(true);
                    }}
                    style={{ padding: '0.65rem 1.4rem', fontSize: '0.92rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', margin: '0 auto' }}
                  >
                    <Plus size={18} /> Cadastrar 1º Subtópico
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {selectedCategory.subproblems.map((sub, idx) => (
                    <div 
                      key={sub.id}
                      style={{
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1.25rem',
                        background: '#FFFFFF',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.6rem' }}>
                        <div>
                          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent-gold-dark)', textTransform: 'uppercase' }}>
                            Subtópico #{idx + 1}
                          </span>
                          <strong style={{ fontSize: '1.02rem', color: 'var(--text-main)', display: 'block', marginTop: '0.1rem' }}>
                            {sub.title}
                          </strong>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className={`badge ${sub.defaultSeverity === 'Crítica' ? 'badge-critica' : sub.defaultSeverity === 'Alta' ? 'badge-alta' : 'badge-media'}`}>
                            {sub.defaultSeverity}
                          </span>

                          {/* Botão Editar Subtópico */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditSubproblem(sub)}
                            className="btn-secondary"
                            style={{ fontSize: '0.76rem', padding: '0.3rem 0.6rem', color: 'var(--primary-brown)' }}
                            title="Editar este subtópico e os 3 planos de ação"
                          >
                            <Edit2 size={13} /> Editar
                          </button>

                          {/* Botão Excluir Subtópico */}
                          <button
                            type="button"
                            onClick={() => handleDeleteSubproblem(sub.id, sub.title)}
                            style={{ color: '#EF4444', padding: '0.3rem', borderRadius: '4px' }}
                            title="Excluir este subtópico"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Caixa com os 3 Planos de Ação */}
                      <div style={{ background: 'var(--bg-warm)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginTop: '0.5rem' }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--primary-brown)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Lightbulb size={13} color="var(--accent-gold-dark)" /> 3 Planos de Ação Pré-configurados:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          {(sub.suggestedActions || [sub.suggestedAction || 'Definir ação']).map((action, aIdx) => (
                            <div key={aIdx} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', padding: '0.15rem 0' }}>
                              <strong style={{ color: 'var(--primary-brown)' }}>Opção {aIdx + 1}:</strong> {action}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          MODAL: EDITAR TÓPICO PRINCIPAL
          ========================================================================= */}
      {isEditCatModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditCatModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--primary-brown)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit2 size={20} /> Editar Tópico Principal
              </h2>
              <button onClick={() => setIsEditCatModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditCategory}>
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Nome do Tópico Principal *</label>
                  <input 
                    type="text" 
                    value={editCatName} 
                    onChange={(e) => setEditCatName(e.target.value)} 
                    placeholder="Ex: FAT ABAIXO DO ORÇADO, DELIVERY..." 
                    required 
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Descrição do Tópico</label>
                  <textarea 
                    rows="3"
                    value={editCatDesc} 
                    onChange={(e) => setEditCatDesc(e.target.value)} 
                    placeholder="Resumo do que abrange este tópico operacional..." 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsEditCatModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={16} /> Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDITAR SUBTÓPICO (TÍTULO, SEVERIDADE E 3 AÇÕES)
          ========================================================================= */}
      {editingSubproblem && (
        <div className="modal-overlay" onClick={() => setEditingSubproblem(null)}>
          <div className="modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--primary-brown)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit2 size={20} /> Editar Subtópico & Planos de Ação
              </h2>
              <button onClick={() => setEditingSubproblem(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditSubproblem}>
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Tópico Principal Vinculado</label>
                  <input type="text" value={selectedCategory.name} disabled style={{ background: '#F5EFE6', fontWeight: 700 }} />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Título do Subtópico *</label>
                  <input 
                    type="text" 
                    value={subTitle} 
                    onChange={(e) => setSubTitle(e.target.value)} 
                    placeholder="Descrição do subtópico verificado em loja..." 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Severidade Padrão</label>
                  <select value={subSeverity} onChange={(e) => setSubSeverity(e.target.value)}>
                    <option value="Leve">Leve</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1', borderTop: '1px solid #E8DFD8', paddingTop: '0.85rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-brown)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                    3 Planos de Ação Oficiais Sugeridos
                  </span>

                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Opção 1 (Ação Principal Recomendada)</label>
                  <textarea 
                    rows="2"
                    value={subAction1} 
                    onChange={(e) => setSubAction1(e.target.value)} 
                    placeholder="Primeira ação corretiva sugerida..." 
                    required
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Opção 2 (Ação Alternativa)</label>
                  <textarea 
                    rows="2"
                    value={subAction2} 
                    onChange={(e) => setSubAction2(e.target.value)} 
                    placeholder="Segunda ação corretiva sugerida..." 
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Opção 3 (Ação Alternativa)</label>
                  <textarea 
                    rows="2"
                    value={subAction3} 
                    onChange={(e) => setSubAction3(e.target.value)} 
                    placeholder="Terceira ação corretiva sugerida..." 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setEditingSubproblem(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={16} /> Salvar Subtópico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: NOVO TÓPICO PRINCIPAL
          ========================================================================= */}
      {isNewCatModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewCatModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', color: 'var(--primary-brown)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FolderPlus size={20} color="var(--accent-gold-dark)" /> Criar Novo Tópico
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Informe apenas o nome do tópico. Em seguida, você adicionará os subtópicos e planos de ação.
                </p>
              </div>
              <button onClick={() => setIsNewCatModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveNewCategory}>
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Nome do Tópico *</label>
                  <input 
                    type="text" 
                    value={catName} 
                    onChange={(e) => setCatName(e.target.value)} 
                    placeholder="Ex: CONTROLE DE TEMPERATURA, HIGIENE, CAIXA..." 
                    autoFocus
                    required 
                    style={{ fontSize: '0.95rem', padding: '0.65rem 0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsNewCatModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} /> Criar Tópico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: NOVO SUBTÓPICO
          ========================================================================= */}
      {isNewSubModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewSubModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--primary-brown)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={20} /> Adicionar Novo Subtópico
              </h2>
              <button onClick={() => setIsNewSubModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveNewSubproblem}>
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Tópico Principal Vinculado</label>
                  <select value={selectedCatId} onChange={(e) => setSelectedCatId(e.target.value)}>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Título do Subtópico *</label>
                  <input 
                    type="text" 
                    value={subTitle} 
                    onChange={(e) => setSubTitle(e.target.value)} 
                    placeholder="Ex: Demora no tempo de forno no horário de pico..." 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Severidade Padrão</label>
                  <select value={subSeverity} onChange={(e) => setSubSeverity(e.target.value)}>
                    <option value="Leve">Leve</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1', borderTop: '1px solid #E8DFD8', paddingTop: '0.85rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-brown)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                    3 Planos de Ação Oficiais Sugeridos
                  </span>

                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Opção 1 (Ação Principal Recomendada)</label>
                  <textarea 
                    rows="2"
                    value={subAction1} 
                    onChange={(e) => setSubAction1(e.target.value)} 
                    placeholder="Primeira ação corretiva sugerida..." 
                    required
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Opção 2 (Ação Alternativa)</label>
                  <textarea 
                    rows="2"
                    value={subAction2} 
                    onChange={(e) => setSubAction2(e.target.value)} 
                    placeholder="Segunda ação corretiva sugerida..." 
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Opção 3 (Ação Alternativa)</label>
                  <textarea 
                    rows="2"
                    value={subAction3} 
                    onChange={(e) => setSubAction3(e.target.value)} 
                    placeholder="Terceira ação corretiva sugerida..." 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsNewSubModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={16} /> Salvar Subtópico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
