import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  evaluateActionPlanStatus, 
  generateOverdueEmailTemplate, 
  generateOverdueWhatsAppMessage,
  formatBrDate 
} from '../utils/dateHelpers';
import { 
  X, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Mail, 
  Send, 
  MessageSquare, 
  CheckCircle2, 
  Store, 
  User, 
  Building2, 
  Filter, 
  Search, 
  Copy, 
  Check, 
  ChevronRight, 
  BellRing,
  ShieldAlert,
  Flame,
  SlidersHorizontal,
  RotateCcw,
  CalendarRange
} from 'lucide-react';

export default function OverdueActionsModal() {
  const { 
    isOverdueModalOpen, 
    setIsOverdueModalOpen, 
    visits, 
    stores, 
    consultants, 
    categories, 
    updateActionPlanStatus, 
    setSelectedVisitForReport,
    showToast 
  } = useApp();

  const [filterPeriod, setFilterPeriod] = useState('all'); // 'all' | 'today' | 'week' | 'month' | 'critical' | 'risk' | 'all-active' | 'custom'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegionalFilter, setSelectedRegionalFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all'); // 'all' | 'NÃO INICIADO' | 'EM ANDAMENTO' | 'CONCLUÍDO'
  const [selectedDeadlineType, setSelectedDeadlineType] = useState('all'); // 'all' | 'IMEDIATO' | '7 DIAS' | '15 DIAS' | '30 DIAS'
  
  // Custom Date Range State
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [dateFieldBasis, setDateFieldBasis] = useState('dueDate'); // 'dueDate' | 'visitDate'
  const [minOverdueDays, setMinOverdueDays] = useState('0'); // '0' | '1' | '7' | '15' | '30'

  // Notification Modal State
  const [notifyingStoreId, setNotifyingStoreId] = useState(null);
  const [includeFranchisee, setIncludeFranchisee] = useState(true);
  const [includeConsultant, setIncludeConsultant] = useState(true);
  const [includeRegional, setIncludeRegional] = useState(true);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOverdueModalOpen) return null;

  // Extract and evaluate all action plans from all visits
  const allActionPlanRows = [];

  visits.forEach(v => {
    const store = stores.find(s => s.id === v.storeId);
    const consultant = consultants.find(c => c.id === v.consultantId);
    const regionalManager = consultant?.reportsTo 
      ? consultants.find(c => c.id === consultant.reportsTo) 
      : null;

    (v.diagnostics || []).forEach(d => {
      const cat = categories.find(c => c.id === d.categoryId);
      const sub = cat?.subproblems?.find(s => s.id === d.subproblemId);
      const currentStatus = d.actionPlan?.status || 'NÃO INICIADO';
      const deadline = d.actionPlan?.deadline || 'IMEDIATO';

      const metrics = evaluateActionPlanStatus(v.date, deadline, currentStatus);

      allActionPlanRows.push({
        visitId: v.id,
        visitDate: v.date,
        diagnosticId: d.id,
        storeId: v.storeId,
        storeName: store?.name || 'Unidade Spoleto',
        storeCode: store?.code || 'SPO-000',
        storeCity: store?.city || '',
        storeState: store?.state || '',
        franchiseeName: store?.franchisee || 'Franqueado Spoleto',
        storeEmail: store?.email || '',
        consultantId: v.consultantId,
        consultantName: consultant?.name || 'Não atribuído',
        consultantEmail: consultant?.email || '',
        consultantPhone: consultant?.phone || '',
        regionalManagerName: regionalManager?.name || 'Gerência Regional Spoleto',
        regionalManagerEmail: regionalManager?.email || '',
        categoryName: cat?.name ? cat.name.split('(')[0].trim() : 'Geral',
        subproblemTitle: sub?.title || 'Diagnóstico em loja',
        action: d.actionPlan?.action || 'Definir plano de ação corretivo.',
        responsible: d.actionPlan?.responsible || 'GERENTE',
        deadline: deadline,
        status: currentStatus,
        ...metrics
      });
    });
  });

  // Filter based on period presets or custom parameters
  const filteredPlans = allActionPlanRows.filter(plan => {
    // 1. Search Query
    const q = searchTerm.toLowerCase().trim();
    if (q) {
      const matchesSearch = 
        plan.storeName.toLowerCase().includes(q) ||
        plan.storeCode.toLowerCase().includes(q) ||
        plan.consultantName.toLowerCase().includes(q) ||
        plan.subproblemTitle.toLowerCase().includes(q) ||
        plan.action.toLowerCase().includes(q) ||
        plan.categoryName.toLowerCase().includes(q) ||
        plan.responsible.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    // 2. Status Filter
    if (selectedStatusFilter !== 'all' && plan.status !== selectedStatusFilter) {
      return false;
    }

    // 3. Deadline Original Type Filter
    if (selectedDeadlineType !== 'all') {
      const deadUpper = (plan.deadline || '').toUpperCase();
      if (!deadUpper.includes(selectedDeadlineType)) return false;
    }

    // 4. Period Preset vs Custom
    if (filterPeriod === 'all') {
      // Total em Atraso (todos com isOverdue === true e não concluídos)
      if (!plan.isOverdue || plan.isCompleted) return false;
    } else if (filterPeriod === 'today') {
      if (!plan.isDueToday || plan.isCompleted) return false;
    } else if (filterPeriod === 'week') {
      // Atrasados nesta semana (1 a 7 dias em atraso)
      if (!plan.isOverdue || plan.daysOverdue > 7 || plan.isCompleted) return false;
    } else if (filterPeriod === 'month') {
      // Atrasados no mês (1 a 30 dias em atraso)
      if (!plan.isOverdue || plan.daysOverdue > 30 || plan.isCompleted) return false;
    } else if (filterPeriod === 'critical') {
      // Atraso Crítico (> 30 dias)
      if (!plan.isOverdue || plan.daysOverdue <= 30 || plan.isCompleted) return false;
    } else if (filterPeriod === 'risk') {
      // Em Risco / Preventivo (próximos 7 dias)
      if (!plan.isDueThisWeek || plan.isOverdue || plan.isCompleted) return false;
    } else if (filterPeriod === 'all-active') {
      // Todos os não concluídos
      if (plan.isCompleted) return false;
    } else if (filterPeriod === 'custom') {
      // Custom Date Range & Days Overdue
      const targetDateStr = dateFieldBasis === 'visitDate' 
        ? (plan.visitDate.includes('T') ? plan.visitDate.split('T')[0] : plan.visitDate)
        : plan.dueDate.toISOString().split('T')[0];

      if (customStartDate && targetDateStr < customStartDate) return false;
      if (customEndDate && targetDateStr > customEndDate) return false;

      if (minOverdueDays !== '0') {
        const minDays = parseInt(minOverdueDays, 10);
        if (plan.daysOverdue < minDays) return false;
      }
    }

    return true;
  }).sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return b.daysOverdue - a.daysOverdue;
  });

  // Date Quick Preset Setters
  const setQuickDateRange = (type) => {
    setFilterPeriod('custom');
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (type === 'today') {
      setCustomStartDate(todayStr);
      setCustomEndDate(todayStr);
    } else if (type === 'next7') {
      const next7 = new Date();
      next7.setDate(next7.getDate() + 7);
      setCustomStartDate(todayStr);
      setCustomEndDate(next7.toISOString().split('T')[0]);
    } else if (type === 'thisMonth') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setCustomStartDate(startOfMonth);
      setCustomEndDate(endOfMonth);
    } else if (type === 'last30') {
      const last30 = new Date();
      last30.setDate(last30.getDate() - 30);
      setCustomStartDate(last30.toISOString().split('T')[0]);
      setCustomEndDate(todayStr);
    } else if (type === 'clear') {
      setCustomStartDate('');
      setCustomEndDate('');
      setMinOverdueDays('0');
      setSelectedStatusFilter('all');
      setSelectedDeadlineType('all');
    }
  };

  // Group plans for notifications when a specific store is selected
  const storeNotifPlans = notifyingStoreId 
    ? allActionPlanRows.filter(p => p.storeId === notifyingStoreId && p.isOverdue) 
    : [];

  const targetStore = stores.find(s => s.id === notifyingStoreId);
  const targetConsultant = consultants.find(c => c.id === targetStore?.consultantId);
  const targetRegional = targetConsultant?.reportsTo ? consultants.find(c => c.id === targetConsultant.reportsTo) : null;

  // Prepare email template for modal
  const emailData = notifyingStoreId ? generateOverdueEmailTemplate({
    storeName: targetStore?.name || 'Spoleto',
    storeCode: targetStore?.code || 'SPO',
    franchiseeName: targetStore?.franchisee || 'Franqueado',
    consultantName: targetConsultant?.name,
    regionalManagerName: targetRegional?.name,
    overdueItems: storeNotifPlans,
    visitDate: storeNotifPlans[0]?.visitDate || new Date().toISOString()
  }) : { subject: '', body: '' };

  const handleSendEmail = () => {
    const recipients = [];
    if (includeFranchisee && targetStore?.email) recipients.push(targetStore.email);
    if (includeConsultant && targetConsultant?.email) recipients.push(targetConsultant.email);
    if (includeRegional && targetRegional?.email) recipients.push(targetRegional.email);

    const toStr = recipients.join(',');
    const mailtoUrl = `mailto:${toStr}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
    window.location.href = mailtoUrl;
    showToast('Cliente de e-mail aberto com os destinatários oficiais!');
  };

  const handleSendWhatsApp = () => {
    const msg = generateOverdueWhatsAppMessage({
      storeName: targetStore?.name || 'Spoleto',
      storeCode: targetStore?.code || 'SPO',
      consultantName: targetConsultant?.name,
      overdueCount: storeNotifPlans.length,
      overdueItems: storeNotifPlans
    });

    const cleanPhone = (targetConsultant?.phone || '').replace(/\D/g, '');
    const url = cleanPhone 
      ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    showToast('WhatsApp aberto para envio do alerta!');
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(`Assunto: ${emailData.subject}\n\n${emailData.body}`);
    setCopiedText(true);
    showToast('Conteúdo do e-mail copiado para a área de transferência!');
    setTimeout(() => setCopiedText(false), 3000);
  };

  // Count summaries
  const countTotalOverdue = allActionPlanRows.filter(p => p.isOverdue && !p.isCompleted).length;
  const countToday = allActionPlanRows.filter(p => p.isDueToday && !p.isCompleted).length;
  const countThisWeek = allActionPlanRows.filter(p => p.isOverdue && p.daysOverdue <= 7 && !p.isCompleted).length;
  const countThisMonth = allActionPlanRows.filter(p => p.isOverdue && p.daysOverdue <= 30 && !p.isCompleted).length;
  const countCritical = allActionPlanRows.filter(p => p.isOverdue && p.daysOverdue > 30 && !p.isCompleted).length;
  const countAtRisk = allActionPlanRows.filter(p => p.isDueThisWeek && !p.isOverdue && !p.isCompleted).length;
  const countAllPending = allActionPlanRows.filter(p => !p.isCompleted).length;

  return (
    <div className="modal-overlay" onClick={() => setIsOverdueModalOpen(false)}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '1140px', maxHeight: '92vh', overflowY: 'auto', padding: '0', borderRadius: 'var(--radius-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header da Central de Atrasos */}
        <div style={{
          background: 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 50%, #5D3826 100%)',
          padding: '1.75rem 2rem',
          color: '#FFFFFF',
          position: 'relative',
          borderBottom: '3px solid var(--accent-gold)'
        }}>
          <button 
            onClick={() => setIsOverdueModalOpen(false)}
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#FFFFFF',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <BellRing size={26} />
            </div>

            <div>
              <h2 style={{ fontSize: '1.45rem', color: '#FFFFFF', margin: 0, fontWeight: 800 }}>
                Central de Planos de Ação & Controle de Prazos
              </h2>
              <p style={{ color: '#FEE2E2', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
                Pesquisa avançada e acompanhamento minucioso de prazos com disparo de régua de cobrança para Franqueados, Consultores e Gerentes Regionais.
              </p>
            </div>
          </div>

          {/* Quick Counter Pills */}
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div 
              onClick={() => setFilterPeriod('all')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: filterPeriod === 'all' ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                color: filterPeriod === 'all' ? '#991B1B' : '#FFFFFF',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Flame size={15} /> Total em Atraso ({countTotalOverdue})
            </div>

            <div 
              onClick={() => setFilterPeriod('today')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: filterPeriod === 'today' ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                color: filterPeriod === 'today' ? '#991B1B' : '#FFFFFF',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <Clock size={15} /> Vencem Hoje ({countToday})
            </div>

            <div 
              onClick={() => setFilterPeriod('week')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: filterPeriod === 'week' ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                color: filterPeriod === 'week' ? '#991B1B' : '#FFFFFF',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <Calendar size={15} /> Esta Semana ({countThisWeek})
            </div>

            <div 
              onClick={() => setFilterPeriod('month')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: filterPeriod === 'month' ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                color: filterPeriod === 'month' ? '#991B1B' : '#FFFFFF',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <CalendarRange size={15} /> No Mês ({countThisMonth})
            </div>

            <div 
              onClick={() => setFilterPeriod('critical')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: filterPeriod === 'critical' ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                color: filterPeriod === 'critical' ? '#7F1D1D' : '#FFFFFF',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <ShieldAlert size={15} /> Crítico &gt; 30d ({countCritical})
            </div>

            <div 
              onClick={() => setFilterPeriod('risk')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: filterPeriod === 'risk' ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                color: filterPeriod === 'risk' ? '#854D0E' : '#FFFFFF',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <AlertTriangle size={15} /> Em Risco / 7d ({countAtRisk})
            </div>

            <div 
              onClick={() => setFilterPeriod('all-active')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: filterPeriod === 'all-active' ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                color: filterPeriod === 'all-active' ? '#1E293B' : '#FFFFFF',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              Todos Pendentes ({countAllPending})
            </div>

            {/* Custom Period Button / Pill */}
            <div 
              onClick={() => {
                setFilterPeriod('custom');
              }}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: filterPeriod === 'custom' ? 'var(--accent-gold)' : 'rgba(217, 119, 6, 0.45)',
                color: filterPeriod === 'custom' ? '#5D3826' : '#FFFFFF',
                border: '1.5px solid var(--accent-gold)',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                marginLeft: 'auto'
              }}
            >
              <SlidersHorizontal size={15} /> 🎯 Personalizar Prazo / Datas
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem 2rem' }}>
          
          {/* =========================================================================
              PAINEL DE PERSONALIZAÇÃO DE PRAZO & DATAS (EXIBIDO SOMENTE AO CLICAR EM PERSONALIZAR)
              ========================================================================= */}
          {filterPeriod === 'custom' && (
            <div style={{
              background: '#FFFBEB',
              border: '1.5px solid var(--accent-gold)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              boxShadow: '0 3px 8px rgba(217, 119, 6, 0.12)',
              animation: 'fadeInModal 0.2s ease-out'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <SlidersHorizontal size={18} color="var(--primary-brown)" />
                  <strong style={{ fontSize: '0.95rem', color: 'var(--primary-brown)' }}>
                    🎯 Filtro de Prazos e Datas Personalizado Ativo
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    (Defina seu intervalo de datas e critérios de acompanhamento)
                  </span>
                </div>

                {/* Quick Preset Buttons */}
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setQuickDateRange('today')}
                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setQuickDateRange('next7')}
                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                  >
                    Próximos 7 Dias
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setQuickDateRange('thisMonth')}
                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                  >
                    Este Mês
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setQuickDateRange('last30')}
                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                  >
                    Últimos 30 Dias
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setQuickDateRange('clear')}
                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', color: '#991B1B' }}
                  >
                    <RotateCcw size={11} /> Limpar
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setFilterPeriod('all')}
                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', background: '#FFFFFF' }}
                    title="Fechar painel personalizado e voltar aos filtros padrões"
                  >
                    <X size={11} /> Fechar Painel
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                
                {/* Data Inicial */}
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                    📅 Data Inicial (De):
                  </label>
                  <input 
                    type="date"
                    value={customStartDate}
                    onChange={(e) => {
                      setCustomStartDate(e.target.value);
                      setFilterPeriod('custom');
                    }}
                    style={{ width: '100%', fontSize: '0.82rem', padding: '0.45rem 0.6rem' }}
                  />
                </div>

                {/* Data Final */}
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                    📅 Data Final (Até):
                  </label>
                  <input 
                    type="date"
                    value={customEndDate}
                    onChange={(e) => {
                      setCustomEndDate(e.target.value);
                      setFilterPeriod('custom');
                    }}
                    style={{ width: '100%', fontSize: '0.82rem', padding: '0.45rem 0.6rem' }}
                  />
                </div>

                {/* Base da Data */}
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                    Filtrar Intervalo por:
                  </label>
                  <select
                    value={dateFieldBasis}
                    onChange={(e) => {
                      setDateFieldBasis(e.target.value);
                      setFilterPeriod('custom');
                    }}
                    style={{ width: '100%', fontSize: '0.82rem', padding: '0.45rem 0.6rem' }}
                  >
                    <option value="dueDate">Data de Vencimento do Plano</option>
                    <option value="visitDate">Data da Realização da Visita</option>
                  </select>
                </div>

                {/* Faixa Mínima de Atraso */}
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                    Atraso Mínimo:
                  </label>
                  <select
                    value={minOverdueDays}
                    onChange={(e) => {
                      setMinOverdueDays(e.target.value);
                      setFilterPeriod('custom');
                    }}
                    style={{ width: '100%', fontSize: '0.82rem', padding: '0.45rem 0.6rem' }}
                  >
                    <option value="0">Qualquer Atraso (0+ dias)</option>
                    <option value="1">Vencidos há mais de 1 dia</option>
                    <option value="7">Vencidos há mais de 7 dias</option>
                    <option value="15">Vencidos há mais de 15 dias</option>
                    <option value="30">Vencidos há mais de 30 dias (Crítico)</option>
                  </select>
                </div>

                {/* Prazo Original Estabelecido */}
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                    Prazo do Laudo:
                  </label>
                  <select
                    value={selectedDeadlineType}
                    onChange={(e) => setSelectedDeadlineType(e.target.value)}
                    style={{ width: '100%', fontSize: '0.82rem', padding: '0.45rem 0.6rem' }}
                  >
                    <option value="all">Todos os Prazos</option>
                    <option value="IMEDIATO">Imediato (24h/48h)</option>
                    <option value="7 DIAS">7 Dias</option>
                    <option value="15 DIAS">15 Dias</option>
                    <option value="30 DIAS">30 Dias</option>
                  </select>
                </div>

                {/* Status do Plano */}
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                    Status Atual:
                  </label>
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    style={{ width: '100%', fontSize: '0.82rem', padding: '0.45rem 0.6rem' }}
                  >
                    <option value="all">Todos os Status</option>
                    <option value="NÃO INICIADO">Apenas NÃO INICIADO</option>
                    <option value="EM ANDAMENTO">Apenas EM ANDAMENTO</option>
                    <option value="CONCLUÍDO">Apenas CONCLUÍDO</option>
                  </select>
                </div>

              </div>
            </div>
          )}

          {/* Search Bar & Result Count */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text"
                placeholder="Buscar por unidade, código RP, consultor, responsável ou ação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.4rem', width: '100%' }}
              />
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Exibindo <strong>{filteredPlans.length}</strong> plano(s) de ação
            </div>
          </div>

          {/* Table of Overdue Action Plans */}
          {filteredPlans.length === 0 ? (
            <div style={{ padding: '3.5rem 2rem', textAlign: 'center', background: '#FAF8F5', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-strong)' }}>
              <CheckCircle2 size={44} color="#166534" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.15rem', color: '#166534' }}>Nenhum plano de ação encontrado para os critérios pesquisados!</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Tente ajustar o intervalo de datas, filtros de prazo ou termos de busca.
              </p>
            </div>
          ) : (
            <div className="spoleto-table-container" style={{ maxHeight: '440px', overflowY: 'auto' }}>
              <table className="spoleto-table">
                <thead>
                  <tr>
                    <th>Unidade & Código RP</th>
                    <th>Tema / Apontamento</th>
                    <th>Ação Requerida</th>
                    <th>Responsável</th>
                    <th>Prazo & Vencimento</th>
                    <th>Status</th>
                    <th>Ação de Cobrança</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlans.map((plan, idx) => (
                    <tr key={`${plan.visitId}-${plan.diagnosticId}`} style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#FAF8F5' }}>
                      <td>
                        <strong style={{ color: 'var(--primary-brown)', fontSize: '0.86rem', display: 'block' }}>
                          {plan.storeName}
                        </strong>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Código RP: <strong>{plan.storeCode}</strong> &bull; {plan.storeCity}/{plan.storeState}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                          👨‍💼 {plan.consultantName}
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-brown)' }}>
                          {plan.categoryName}
                        </span>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginTop: '0.15rem' }}>
                          {plan.subproblemTitle}
                        </div>
                      </td>

                      <td style={{ maxWidth: '220px', fontSize: '0.8rem' }}>
                        {plan.action}
                      </td>

                      <td style={{ textAlign: 'center', fontSize: '0.78rem', fontWeight: 600 }}>
                        {plan.responsible}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', color: plan.isOverdue ? '#991B1B' : plan.isCompleted ? '#166534' : '#854D0E' }}>
                          Venceu/Vence: {plan.formattedDueDate}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                          Visita: {formatBrDate(plan.visitDate)} ({plan.deadline})
                        </div>
                        <span className={`badge ${plan.isCompleted ? 'badge-concluido' : plan.isOverdue ? 'badge-critica' : 'badge-media'}`} style={{ fontSize: '0.68rem', marginTop: '0.2rem' }}>
                          {plan.isCompleted ? 'Concluído' : plan.isOverdue ? `${plan.daysOverdue} dia(s) em atraso` : `Vence em ${plan.daysRemaining}d`}
                        </span>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <select
                          value={plan.status}
                          onChange={(e) => updateActionPlanStatus(plan.visitId, plan.diagnosticId, e.target.value)}
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.25rem 0.4rem',
                            borderRadius: '4px',
                            backgroundColor: plan.status === 'CONCLUÍDO' ? 'var(--status-concluido-bg)' : plan.status === 'EM ANDAMENTO' ? 'var(--status-em-andamento-bg)' : 'var(--status-nao-iniciado-bg)',
                            color: plan.status === 'CONCLUÍDO' ? 'var(--status-concluido-text)' : plan.status === 'EM ANDAMENTO' ? 'var(--status-em-andamento-text)' : 'var(--status-nao-iniciado-text)'
                          }}
                        >
                          <option value="NÃO INICIADO">NÃO INICIADO</option>
                          <option value="EM ANDAMENTO">EM ANDAMENTO</option>
                          <option value="CONCLUÍDO">CONCLUÍDO</option>
                        </select>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn-primary"
                          style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', gap: '0.3rem', whiteSpace: 'nowrap' }}
                          onClick={() => setNotifyingStoreId(plan.storeId)}
                        >
                          <Send size={12} /> Notificar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* Modal Secundário de Disparo de E-mail / WhatsApp */}
        {notifyingStoreId && (
          <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setNotifyingStoreId(null)}>
            <div 
              className="modal-card" 
              style={{ maxWidth: '650px', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-brown)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <Mail size={18} /> Notificação de Planos Atrasados
                </h3>
                <button 
                  onClick={() => setNotifyingStoreId(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Store & Overdue Summary */}
              <div style={{ background: '#FAF8F5', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ fontSize: '1rem', color: 'var(--primary-brown)' }}>{targetStore?.name}</strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Código RP: <strong>{targetStore?.code}</strong> &bull; {targetStore?.city}/{targetStore?.state}
                    </div>
                  </div>
                  <span className="badge badge-critica" style={{ fontSize: '0.75rem' }}>
                    {storeNotifPlans.length} plano(s) pendente(s)
                  </span>
                </div>
              </div>

              {/* Destinatários Oficiais Selecionáveis */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ marginBottom: '0.5rem' }}>
                  Selecione quem receberá o alerta oficial:
                </label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', padding: '0.4rem 0.6rem', background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '4px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={includeFranchisee} 
                      onChange={(e) => setIncludeFranchisee(e.target.checked)} 
                    />
                    <div>
                      <strong>Franqueado(a):</strong> {targetStore?.franchisee || 'Franqueado'} ({targetStore?.email || 'sem e-mail cadastrado'})
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', padding: '0.4rem 0.6rem', background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '4px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={includeConsultant} 
                      onChange={(e) => setIncludeConsultant(e.target.checked)} 
                    />
                    <div>
                      <strong>Consultor(a) de Negócios:</strong> {targetConsultant?.name || 'Não atribuído'} ({targetConsultant?.email || 'sem e-mail'})
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', padding: '0.4rem 0.6rem', background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '4px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={includeRegional} 
                      onChange={(e) => setIncludeRegional(e.target.checked)} 
                    />
                    <div>
                      <strong>Gerente Regional:</strong> {targetRegional?.name || 'Gerência Regional'} ({targetRegional?.email || 'sem e-mail'})
                    </div>
                  </label>
                </div>
              </div>

              {/* Preview da Mensagem */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Prévia do E-mail:</label>
                  <button 
                    type="button" 
                    onClick={handleCopyEmail}
                    className="btn-secondary"
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    {copiedText ? <Check size={12} color="#166534" /> : <Copy size={12} />}
                    {copiedText ? 'Copiado!' : 'Copiar Texto'}
                  </button>
                </div>
                <textarea 
                  readOnly 
                  value={`Assunto: ${emailData.subject}\n\n${emailData.body}`}
                  rows={6}
                  style={{ width: '100%', fontSize: '0.78rem', fontFamily: 'monospace', backgroundColor: '#FAF8F5', resize: 'vertical' }}
                />
              </div>

              {/* Botões de Ação de Disparo */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setNotifyingStoreId(null)}
                >
                  Fechar
                </button>
                
                <button 
                  type="button" 
                  className="btn-primary" 
                  onClick={handleSendWhatsApp}
                  style={{ backgroundColor: '#25D366', borderColor: '#25D366', color: '#FFFFFF', gap: '0.4rem' }}
                >
                  <MessageSquare size={15} /> Disparar WhatsApp
                </button>

                <button 
                  type="button" 
                  className="btn-primary" 
                  onClick={handleSendEmail}
                  style={{ backgroundColor: '#1E40AF', borderColor: '#1E40AF', color: '#FFFFFF', gap: '0.4rem' }}
                >
                  <Send size={15} /> Disparar E-mail
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
