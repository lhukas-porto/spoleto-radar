import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import DateInput from './DateInput';
import { 
  FileText, 
  Search, 
  Calendar, 
  Store, 
  Users, 
  Filter, 
  ChevronRight, 
  Printer, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Eye,
  CalendarRange,
  Edit3,
  Trash2
} from 'lucide-react';

export default function ReportsView() {
  const { 
    visits, 
    stores, 
    consultants, 
    categories, 
    setSelectedVisitForReport,
    startEditVisit,
    deleteVisit,
    setSelectedStaffForProfile 
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('visits'); // 'visits' | 'themes' | 'consultants' | 'action-plans'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConsultant, setSelectedConsultant] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Date Filters
  const [periodFilter, setPeriodFilter] = useState('all'); // 'all' | '7days' | '1month' | '3months' | '6months' | '1year' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Helper to filter visits by period
  const filterByPeriod = (visit) => {
    if (periodFilter === 'all') return true;

    const visitDate = new Date(visit.date + 'T12:00:00');
    const now = new Date();

    if (periodFilter === '7days') {
      const diffDays = (now - visitDate) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }
    if (periodFilter === '1month') {
      const diffDays = (now - visitDate) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 30;
    }
    if (periodFilter === '3months') {
      const diffDays = (now - visitDate) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 90;
    }
    if (periodFilter === '6months') {
      const diffDays = (now - visitDate) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 180;
    }
    if (periodFilter === '1year') {
      const diffDays = (now - visitDate) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 365;
    }
    if (periodFilter === 'custom') {
      if (customStartDate && visit.date < customStartDate) return false;
      if (customEndDate && visit.date > customEndDate) return false;
      return true;
    }
    return true;
  };

  // Filtered Visits
  const filteredVisits = visits.filter(visit => {
    const store = stores.find(s => s.id === visit.storeId);
    const consultant = consultants.find(c => c.id === visit.consultantId);

    const matchesSearch = 
      store?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultant?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (visit.generalNotes && visit.generalNotes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesConsultant = selectedConsultant === 'all' || visit.consultantId === selectedConsultant;
    const matchesPeriod = filterByPeriod(visit);

    return matchesSearch && matchesConsultant && matchesPeriod;
  });

  // Extract all Action Plans for table view
  const allActionPlans = [];
  filteredVisits.forEach(visit => {
    const store = stores.find(s => s.id === visit.storeId);
    const consultant = consultants.find(c => c.id === visit.consultantId);

    visit.diagnostics.forEach(diag => {
      const cat = categories.find(c => c.id === diag.categoryId);
      const sub = cat?.subproblems.find(s => s.id === diag.subproblemId);

      const matchesCat = selectedCategory === 'all' || diag.categoryId === selectedCategory;
      const status = diag.actionPlan?.status || 'NÃO INICIADO';
      const matchesStatus = selectedStatus === 'all' || status === selectedStatus;

      if (matchesCat && matchesStatus) {
        allActionPlans.push({
          visitId: visit.id,
          visitDate: visit.date,
          storeName: store?.name,
          storeCode: store?.code,
          consultantName: consultant?.name,
          categoryName: cat?.name || 'Geral',
          subproblemTitle: sub?.title || 'Diagnóstico em loja',
          action: diag.actionPlan?.action || 'Sem ação cadastrada',
          responsible: diag.actionPlan?.responsible || 'Gerente',
          deadline: diag.actionPlan?.deadline || 'Imediato',
          status: status,
          notes: diag.notes || ''
        });
      }
    });
  });

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Central de Relatórios & Inteligência Operacional</h1>
          <p className="section-subtitle">
            Consulte históricos de visitas, audite os planos de ação e acompanhe os indicadores consolidados da rede Spoleto.
          </p>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          className={`btn-secondary ${activeSubTab === 'visits' ? 'btn-primary' : ''}`}
          onClick={() => setActiveSubTab('visits')}
          style={{ fontSize: '0.85rem' }}
        >
          <FileText size={15} /> Visitas Realizadas ({filteredVisits.length})
        </button>

        <button
          className={`btn-secondary ${activeSubTab === 'action-plans' ? 'btn-primary' : ''}`}
          onClick={() => setActiveSubTab('action-plans')}
          style={{ fontSize: '0.85rem' }}
        >
          <CheckCircle2 size={15} /> Planos de Ação Individuais ({allActionPlans.length})
        </button>
      </div>

      {/* Barra de Filtros & Período de Referência */}
      <div className="card-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          
          {/* Busca Textual */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Search size={13} /> Buscar por Loja ou Código
            </label>
            <input 
              type="text" 
              placeholder="Ex: SPO-001, Leblon, Carlos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Período de Referência Solicitado */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={13} /> Período de Referência
            </label>
            <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)}>
              <option value="all">Todo o Histórico</option>
              <option value="7days">Últimos 7 dias</option>
              <option value="1month">Último mês</option>
              <option value="3months">Últimos 3 meses</option>
              <option value="6months">Último semestre</option>
              <option value="1year">Último ano</option>
              <option value="custom">📅 Customizar período</option>
            </select>
          </div>

          {/* Filtro por Consultor */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Users size={13} /> Consultor de Negócios
            </label>
            <select value={selectedConsultant} onChange={(e) => setSelectedConsultant(e.target.value)}>
              <option value="all">Todos os Consultores</option>
              {consultants.filter(c => (c.role || 'CONSULTOR') === 'CONSULTOR').map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Filtros Específicos para a aba de Planos de Ação */}
          {activeSubTab === 'action-plans' && (
            <>
              <div className="form-group">
                <label className="form-label">Tema Principal</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option value="all">Todos os Temas</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status da Ação</label>
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option value="all">Todos os Status</option>
                  <option value="NÃO INICIADO">Não Iniciado</option>
                  <option value="EM ANDAMENTO">Em Andamento</option>
                  <option value="CONCLUÍDO">Concluído</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Seleção Customizada de Datas (Aparece quando escolhe 'Customizar período') */}
        {periodFilter === 'custom' && (
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-subtle)', alignItems: 'center', flexWrap: 'wrap', background: 'var(--bg-warm)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-brown)' }}>
              <CalendarRange size={16} color="var(--accent-gold-dark)" /> Selecione o Intervalo de Datas:
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>De:</label>
              <DateInput 
                value={customStartDate} 
                onChange={setCustomStartDate}
                style={{ width: '140px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Até:</label>
              <DateInput 
                value={customEndDate} 
                onChange={setCustomEndDate}
                style={{ width: '140px' }}
              />
            </div>

            {(customStartDate || customEndDate) && (
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
              >
                Limpar Datas
              </button>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          ABA 1: LISTA DE VISITAS REALIZADAS
          ========================================================================= */}
      {activeSubTab === 'visits' && (
        <div className="card-panel" style={{ padding: 0, overflow: 'hidden' }}>
          {filteredVisits.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FileText size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <h3>Nenhuma visita encontrada para os filtros selecionados</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Tente ajustar o termo de busca ou alterar o período de referência selecionado.
              </p>
            </div>
          ) : (
            <div className="spoleto-table-container">
              <table className="spoleto-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Unidade Spoleto</th>
                    <th>Tipo</th>
                    <th>Consultor(a) de Negócios</th>
                    <th>Apontamentos</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisits.map((visit, idx) => {
                    const store = stores.find(s => s.id === visit.storeId);
                    const consultant = consultants.find(c => c.id === visit.consultantId);

                    return (
                      <tr key={visit.id} style={{ background: idx % 2 === 0 ? '#FFFFFF' : 'var(--bg-warm)' }}>
                        <td style={{ textAlign: 'center', fontWeight: 700, width: '110px' }}>
                          {new Date(visit.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </td>

                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--primary-brown)', fontSize: '0.88rem' }}>
                            {store?.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Código RP: <strong>{store?.code}</strong> &bull; {store?.city}/{store?.state}
                          </div>
                        </td>

                        <td style={{ textAlign: 'center', width: '130px' }}>
                          <span style={{ 
                            fontSize: '0.72rem', 
                            padding: '0.2rem 0.5rem', 
                            borderRadius: 'var(--radius-sm)', 
                            background: visit.visitType === 'Visita surpresa' ? 'var(--status-nao-iniciado-bg)' : 'var(--primary-brown-light)',
                            color: visit.visitType === 'Visita surpresa' ? 'var(--status-nao-iniciado-text)' : 'var(--primary-brown)',
                            fontWeight: 700,
                            textTransform: 'uppercase'
                          }}>
                            {visit.visitType || 'Visita agendada'}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center', fontWeight: 600 }}>
                          {consultant ? (
                            <span 
                              onClick={() => setSelectedStaffForProfile(consultant)}
                              style={{ color: 'var(--primary-brown)', textDecoration: 'underline', cursor: 'pointer' }}
                              title="Ver Ficha do Colaborador"
                            >
                              {consultant.name}
                            </span>
                          ) : (
                            'Não atribuído'
                          )}
                        </td>

                        <td style={{ textAlign: 'center', width: '130px' }}>
                          <span className="badge badge-media">
                            {visit.diagnostics.length} {visit.diagnostics.length === 1 ? 'item' : 'itens'}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center', width: '220px' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => setSelectedVisitForReport(visit)}
                              style={{ fontSize: '0.74rem', padding: '0.3rem 0.6rem' }}
                              title="Visualizar laudo oficial e PDF"
                            >
                              <Eye size={12} /> Ver
                            </button>

                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => startEditVisit(visit)}
                              style={{ fontSize: '0.74rem', padding: '0.3rem 0.6rem' }}
                              title="Editar este relatório"
                            >
                              <Edit3 size={12} /> Editar
                            </button>

                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => {
                                if (confirm(`Tem certeza que deseja excluir permanentemente o relatório da unidade "${store?.name}" realizado em ${new Date(visit.date + 'T12:00:00').toLocaleDateString('pt-BR')}?`)) {
                                  deleteVisit(visit.id);
                                }
                              }}
                              style={{ fontSize: '0.74rem', padding: '0.3rem 0.5rem', color: '#991B1B', borderColor: '#FECACA' }}
                              title="Excluir relatório"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          ABA 2: TABELA GERAL DE PLANOS DE AÇÃO INDIVIDUAIS
          ========================================================================= */}
      {activeSubTab === 'action-plans' && (
        <div className="card-panel" style={{ padding: 0, overflow: 'hidden' }}>
          {allActionPlans.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <h3>Nenhum plano de ação encontrado para os filtros selecionados</h3>
            </div>
          ) : (
            <div className="spoleto-table-container">
              <table className="spoleto-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Unidade</th>
                    <th>Tema / Causa</th>
                    <th>Ação Corretiva</th>
                    <th>Quem</th>
                    <th>Status</th>
                    <th>Prazo</th>
                    <th>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {allActionPlans.map((plan, idx) => {
                    let statusClass = 'status-cell-nao-iniciado';
                    if (plan.status === 'EM ANDAMENTO') statusClass = 'status-cell-em-andamento';
                    if (plan.status === 'CONCLUÍDO') statusClass = 'status-cell-concluido';

                    return (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? '#FFFFFF' : 'var(--bg-warm)' }}>
                        <td style={{ textAlign: 'center', fontWeight: 600, width: '90px' }}>
                          {new Date(plan.visitDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </td>

                        <td style={{ fontWeight: 700, fontSize: '0.8rem', width: '160px' }}>
                          {plan.storeName}
                        </td>

                        <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.76rem', textTransform: 'uppercase', color: 'var(--primary-brown)', width: '130px' }}>
                          {plan.categoryName.split('(')[0].trim()}
                        </td>

                        <td style={{ color: 'var(--text-main)', lineHeight: '1.35' }}>
                          {plan.action}
                        </td>

                        <td style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', width: '100px' }}>
                          {plan.responsible}
                        </td>

                        <td className={statusClass} style={{ width: '120px' }}>
                          {plan.status}
                        </td>

                        <td style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', width: '95px' }}>
                          {plan.deadline}
                        </td>

                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', width: '160px' }}>
                          {plan.notes || plan.subproblemTitle}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
