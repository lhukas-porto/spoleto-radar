import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Store, 
  MapPin, 
  User, 
  Plus, 
  Search, 
  Filter, 
  Star, 
  Calendar,
  X
} from 'lucide-react';

export default function StoresView() {
  const { stores, consultants, visits, addStore } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New store form state
  const [newStore, setNewStore] = useState({
    code: '',
    name: '',
    city: '',
    state: 'RJ',
    locationType: 'Shopping',
    address: '',
    
    consultantId: consultants[0]?.id || ''
  });

  const filteredStores = stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          store.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          store.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          store.franchisee.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = stateFilter === 'Todos' || store.state === stateFilter;
    return matchesSearch && matchesState;
  });

  const handleSaveStore = (e) => {
    e.preventDefault();
    if (!newStore.name || !newStore.code) {
      alert('Preencha pelo menos o Código e o Nome da Loja.');
      return;
    }
    addStore(newStore);
    setIsModalOpen(false);
    setNewStore({
      code: '',
      name: '',
      city: '',
      state: 'RJ',
      locationType: 'Shopping',
      address: '',
      
      consultantId: consultants[0]?.id || ''
    });
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Rede de Lojas Spoleto</h1>
          <p className="section-subtitle">Gestão das franquias, franqueados responsáveis e consultores vinculados.</p>
        </div>

        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Cadastrar Nova Loja
        </button>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="card-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Buscar por nome, código SPO, cidade ou franqueado..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.4rem', width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Estado:</span>
            {['Todos', 'RJ', 'SP', 'MG', 'PR', 'DF'].map(st => (
              <button
                key={st}
                onClick={() => setStateFilter(st)}
                className={`btn-secondary ${stateFilter === st ? 'btn-primary' : ''}`}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
              >
                {st}
              </button>
            ))}
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
                    {store.code}
                  </span>
                  <span style={{ fontSize: '0.75rem', background: '#F3F4F6', color: '#374151', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                    {store.locationType}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  {store.name}
                </h3>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  <MapPin size={14} color="var(--text-muted)" />
                  {store.city} - {store.state}
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Franqueado(a):</span> <strong>{store.franchisee}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Consultor(a):</span> <strong>{consultant?.name || 'Não atribuído'}</strong>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  {storeVisits.length} visita{storeVisits.length !== 1 ? 's' : ''} realizada{storeVisits.length !== 1 ? 's' : ''}
                </span>
                {lastVisit && (
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Última: {new Date(lastVisit.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Cadastro de Loja */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--primary-brown)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Store size={22} /> Cadastrar Nova Franquia Spoleto
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveStore}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Código da Loja (ex: SPO-0601) *</label>
                  <input 
                    type="text" 
                    value={newStore.code} 
                    onChange={(e) => setNewStore({ ...newStore, code: e.target.value.toUpperCase() })} 
                    placeholder="SPO-0601" 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nome da Unidade *</label>
                  <input 
                    type="text" 
                    value={newStore.name} 
                    onChange={(e) => setNewStore({ ...newStore, name: e.target.value })} 
                    placeholder="Spoleto Shopping ..." 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cidade *</label>
                  <input 
                    type="text" 
                    value={newStore.city} 
                    onChange={(e) => setNewStore({ ...newStore, city: e.target.value })} 
                    placeholder="Cidade" 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Estado (UF) *</label>
                  <select 
                    value={newStore.state} 
                    onChange={(e) => setNewStore({ ...newStore, state: e.target.value })}
                  >
                    <option value="RJ">RJ - Rio de Janeiro</option>
                    <option value="SP">SP - São Paulo</option>
                    <option value="MG">MG - Minas Gerais</option>
                    <option value="PR">PR - Paraná</option>
                    <option value="DF">DF - Distrito Federal</option>
                    <option value="RS">RS - Rio Grande do Sul</option>
                    <option value="SC">SC - Santa Catarina</option>
                    <option value="BA">BA - Bahia</option>
                    <option value="GO">GO - Goiás</option>
                  </select>
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
                    onChange={(e) => setNewStore({ ...newStore, franchisee: e.target.value })} 
                    placeholder="Nome completo do franqueado" 
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Endereço Completo</label>
                  <input 
                    type="text" 
                    value={newStore.address} 
                    onChange={(e) => setNewStore({ ...newStore, address: e.target.value })} 
                    placeholder="Av. / Rua, número, bairro..." 
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Consultor(a) de Negócios Atribuído</label>
                  <select 
                    value={newStore.consultantId} 
                    onChange={(e) => setNewStore({ ...newStore, consultantId: e.target.value })}
                  >
                    {consultants.map(c => (
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
    </div>
  );
}
