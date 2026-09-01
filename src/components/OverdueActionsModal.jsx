import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  evaluateActionPlanStatus, 
  generateOverdueEmailTemplate, 
  generateOverdueWhatsAppMessage,
  getVisitCriticalSla,
  generateDMinusOnePreventionEmail,
  generateDZeroCriticalEscalationEmail,
  formatBrDate,
  formatPhoneNumber
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
  CalendarRange,
  Zap,
  Layers,
  FileText,
  ExternalLink,
  Users
} from 'lucide-react';

export default function OverdueActionsModal() {
  const { 
    isOverdueModalOpen, 
    setIsOverdueModalOpen, 
    visits, 
    stores, 
    consultants, 
    categories, 
    getStoreFranchisees,
    updateActionPlanStatus, 
    setSelectedVisitForReport,
    showToast 
  } = useApp();

  // Navigation mode inside modal
  const [activeTabMode, setActiveTabMode] = useState('regua'); // 'regua' | 'all-plans'
  const [reguaFilter, setReguaFilter] = useState('all'); // 'all' | 'd-1' | 'd-0'

  // Table Filters State
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
  const [notificationConfig, setNotificationConfig] = useState(null); 
  // { type: 'prevention' | 'critical', visitItem: object }
  const [includeFranchisee, setIncludeFranchisee] = useState(true);
  const [includeConsultant, setIncludeConsultant] = useState(true);
  const [includeRegional, setIncludeRegional] = useState(true);
  const [includeNational, setIncludeNational] = useState(true);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOverdueModalOpen) return null;

  // Gerente Nacional oficial
  const nationalManager = consultants.find(c => c.role === 'GERENTE_NACIONAL') || {
    id: 'staff-gn-liliane',
    name: 'LILIANE TAHAN CURY TEIXEIRA DE RESENDE',
    email: 'liliane.cury@spoleto.com.br',
    phone: '(61) 98134-0653',
    role: 'GERENTE_NACIONAL'
  };

  // 1. Group visits and calculate their Critical SLA (Shortest deadline among open items)
  const visitsWithSla = visits.map(v => {
    const store = stores.find(s => s.id === v.storeId);
    const consultant = consultants.find(c => c.id === v.consultantId);
    const regionalManager = consultant?.reportsTo 
      ? consultants.find(c => c.id === consultant.reportsTo) 
      : consultants.find(c => c.region === consultant?.region && c.role === 'GERENTE_REGIONAL') || null;

    const sla = getVisitCriticalSla(v, categories);
    return {
      visit: v,
      store,
      consultant,
      regionalManager,
      nationalManager,
      sla
    };
  }).filter(item => item.sla && item.sla.hasOpenPlans);

  // Visitas em D-1 (Alerta de Prevenção - Vencem amanhã / faltam 24h)
  const dMinusOneVisits = visitsWithSla.filter(item => item.sla.isDMinusOne);

  // Visitas em D-0 / Atraso (Alerta Crítico / Atenção Total e Absoluta - Vencem hoje ou atrasadas)
  const dZeroAndOverdueVisits = visitsWithSla.filter(item => item.sla.isDZeroOrOverdue);

  // 2. Extract and evaluate individual action plan rows for table view
  const allActionPlanRows = [];
  visits.forEach(v => {
    const store = stores.find(s => s.id === v.storeId);
    const consultant = consultants.find(c => c.id === v.consultantId);
    const regionalManager = consultant?.reportsTo 
      ? consultants.find(c => c.id === consultant.reportsTo) 
      : consultants.find(c => c.region === consultant?.region && c.role === 'GERENTE_REGIONAL') || null;

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
        storePhone: store?.phone || '',
        consultantId: v.consultantId,
        consultantName: consultant?.name || 'Não atribuído',
        consultantEmail: consultant?.email || '',
        consultantPhone: consultant?.phone || '',
        regionalManagerName: regionalManager?.name || 'Gerência Regional Spoleto',
        regionalManagerEmail: regionalManager?.email || '',
        nationalManagerName: nationalManager?.name || 'LILIANE TAHAN CURY TEIXEIRA DE RESENDE',
        nationalManagerEmail: nationalManager?.email || 'liliane.cury@spoleto.com.br',
        categoryName: cat?.name ? cat.name.split('(')[0].trim() : 'Geral',
        subproblemTitle: sub?.title || 'Diagnóstico em loja',
        action: d.actionPlan?.action || 'Definir plano de ação corretivo.',
        responsible: d.actionPlan?.responsible || 'GERENTE',
        deadline: deadline,
        status: currentStatus,
        rawVisit: v,
        rawStore: store,
        rawConsultant: consultant,
        rawRegional: regionalManager,
        ...metrics
      });
    });
  });

  // Filter based on period presets or custom parameters for table
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

    // 4. Regional Manager Filter
    if (selectedRegionalFilter !== 'all' && plan.regionalManagerName !== selectedRegionalFilter) {
      return false;
    }

    // 5. Period Preset Filter
    if (filterPeriod === 'today') {
      return plan.isDueToday && !plan.isCompleted;
    }
    if (filterPeriod === 'week') {
      return plan.isOverdue && plan.daysOverdue <= 7 && !plan.isCompleted;
    }
    if (filterPeriod === 'month') {
      return plan.isOverdue && plan.daysOverdue <= 30 && !plan.isCompleted;
    }
    if (filterPeriod === 'critical') {
      return plan.isOverdue && plan.daysOverdue > 30 && !plan.isCompleted;
    }
    if (filterPeriod === 'risk') {
      return plan.isDueThisWeek && !plan.isOverdue && !plan.isCompleted;
    }
    if (filterPeriod === 'all-active') {
      return !plan.isCompleted;
    }

    // 6. Custom Date Range Filter
    if (filterPeriod === 'custom') {
      const targetDateStr = dateFieldBasis === 'dueDate' 
        ? plan.dueDate.toISOString().split('T')[0] 
        : plan.visitDate.split('T')[0];

      if (customStartDate && targetDateStr < customStartDate) return false;
      if (customEndDate && targetDateStr > customEndDate) return false;

      const minDays = parseInt(minOverdueDays, 10) || 0;
      if (minDays > 0 && plan.daysOverdue < minDays) return false;
    }

    return true;
  });

  // Filter for Régua list
  const filteredReguaVisits = visitsWithSla.filter(item => {
    if (reguaFilter === 'd-1') return item.sla.isDMinusOne;
    if (reguaFilter === 'd-0') return item.sla.isDZeroOrOverdue;
    return item.sla.isDMinusOne || item.sla.isDZeroOrOverdue;
  });

  // Notification Modal Data Calculation
  const selectedVisitItem = notificationConfig?.visitItem;
  const isPrevention = notificationConfig?.type === 'prevention';

  const storeFrans = selectedVisitItem ? (getStoreFranchisees ? getStoreFranchisees(selectedVisitItem.store?.id) : []) : [];
  const combinedFranName = storeFrans.length > 0 
    ? storeFrans.map(f => f.name).join(' / ') 
    : (selectedVisitItem?.store?.franchisee || 'Franqueado Spoleto');

  const emailData = selectedVisitItem ? (
    isPrevention ? generateDMinusOnePreventionEmail({
      storeName: selectedVisitItem.store?.name || 'Spoleto',
      storeCode: selectedVisitItem.store?.code || 'SPO',
      franchiseeName: combinedFranName,
      consultantName: selectedVisitItem.consultant?.name,
      regionalManagerName: selectedVisitItem.regionalManager?.name,
      nationalManagerName: nationalManager?.name,
      minDueDateFormatted: selectedVisitItem.sla?.formattedMinDueDate,
      openItems: selectedVisitItem.sla?.openItems || [],
      visitDate: selectedVisitItem.visit?.date
    }) : generateDZeroCriticalEscalationEmail({
      storeName: selectedVisitItem.store?.name || 'Spoleto',
      storeCode: selectedVisitItem.store?.code || 'SPO',
      franchiseeName: combinedFranName,
      consultantName: selectedVisitItem.consultant?.name,
      regionalManagerName: selectedVisitItem.regionalManager?.name,
      nationalManagerName: nationalManager?.name,
      minDueDateFormatted: selectedVisitItem.sla?.formattedMinDueDate,
      daysOverdue: selectedVisitItem.sla?.daysOverdue || 0,
      openItems: selectedVisitItem.sla?.openItems || [],
      visitDate: selectedVisitItem.visit?.date
    })
  ) : { subject: '', body: '' };

  const handleSendEmail = () => {
    if (!selectedVisitItem) return;
    const toRecipients = [];
    const ccRecipients = [];

    // Franqueados como destinatários principais (TO)
    if (includeFranchisee) {
      if (storeFrans.length > 0) {
        storeFrans.forEach(f => {
          if (f.email && !toRecipients.includes(f.email)) toRecipients.push(f.email);
        });
      } else if (selectedVisitItem.store?.email) {
        selectedVisitItem.store.email.split(',').forEach(e => {
          const clean = e.trim().toLowerCase();
          if (clean && !toRecipients.includes(clean)) toRecipients.push(clean);
        });
      }
    }

    if (toRecipients.length === 0 && includeConsultant && selectedVisitItem.consultant?.email) {
      toRecipients.push(selectedVisitItem.consultant.email);
    }

    // Cadeia em cópia (CC)
    if (includeConsultant && selectedVisitItem.consultant?.email && !toRecipients.includes(selectedVisitItem.consultant.email)) {
      ccRecipients.push(selectedVisitItem.consultant.email);
    }
    if (includeRegional && selectedVisitItem.regionalManager?.email) {
      ccRecipients.push(selectedVisitItem.regionalManager.email);
    }
    if (includeNational && nationalManager?.email) {
      ccRecipients.push(nationalManager.email);
    }

    const toStr = toRecipients.join(',') || 'consultoria@spoleto.com.br';
    const ccParam = ccRecipients.length > 0 ? `&cc=${encodeURIComponent(ccRecipients.join(','))}` : '';
    const mailtoUrl = `mailto:${toStr}?subject=${encodeURIComponent(emailData.subject)}${ccParam}&body=${encodeURIComponent(emailData.body)}`;
    
    window.location.href = mailtoUrl;
    showToast('🚀 E-mail aberto com Franqueado(s), Consultor, Gerente Regional e Gerente Nacional!');
  };

  const handleSendWhatsApp = () => {
    if (!selectedVisitItem) return;
    let msg = isPrevention 
      ? `⚠️ *SPOLETO RADAR • ALERTA PREVENTIVO DE PLANO DE AÇÃO (24H)* ⚠️\n\n`
      : `🚨 *SPOLETO RADAR • ESCALAÇÃO CRÍTICA (ATENÇÃO TOTAL E ABSOLUTA)* 🚨\n\n`;

    msg += `Olá! Comunicamos aviso de Plano de Ação para a unidade *${selectedVisitItem.store?.name}* [Código RP: ${selectedVisitItem.store?.code}].\n`;
    msg += `• *Menor Prazo (SLA):* ${selectedVisitItem.sla?.formattedMinDueDate}\n`;
    msg += `• *Status:* ${isPrevention ? 'Vence amanhã (Faltam 24h para o término)' : `${selectedVisitItem.sla?.daysOverdue || 0}d de atraso / Atenção Total`}\n\n`;
    msg += `📋 *Planos de Ação Pendentes:*\n`;
    (selectedVisitItem.sla?.openItems || []).slice(0, 3).forEach((it, idx) => {
      msg += `${idx + 1}. *[${it.categoryName}]* ${it.subproblemTitle}\n   _Ação:_ ${it.action.slice(0, 65)}...\n   _Resp:_ ${it.responsible} | _Prazo:_ ${it.deadline}\n\n`;
    });
    msg += `Notificação oficial em cópia para Franqueado, Consultor (${selectedVisitItem.consultant?.name || 'Spoleto'}), Gerente Regional (${selectedVisitItem.regionalManager?.name || 'Regional'}) e Gerência Nacional (${nationalManager?.name}).`;

    const cleanPhone = (selectedVisitItem.store?.phone || selectedVisitItem.consultant?.phone || '').replace(/\D/g, '');
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

  // Open notification modal from table row
  const handleOpenFromTableRow = (plan) => {
    const isOverdue = plan.isOverdue;
    setNotificationConfig({
      type: isOverdue ? 'critical' : 'prevention',
      visitItem: {
        visit: plan.rawVisit,
        store: plan.rawStore,
        consultant: plan.rawConsultant,
        regionalManager: plan.rawRegional,
        nationalManager,
        sla: getVisitCriticalSla(plan.rawVisit, categories)
      }
    });
  };

  return (
    <div className="modal-overlay" onClick={() => setIsOverdueModalOpen(false)}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '1160px', maxHeight: '92vh', overflowY: 'auto', padding: '0', borderRadius: 'var(--radius-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header da Central de Atrasos & Régua de Prazos */}
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
                Central de Prazos & Régua de Notificações
              </h2>
              <p style={{ color: '#FEE2E2', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
                Régua automática de menor prazo por visita: Alerta Preventivo (D-1) e Escalação de Atenção Total (D-0) com cópia para toda a liderança.
              </p>
            </div>
          </div>

          {/* Abas Principais: Régua de Prazos vs Tabela Completa */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              onClick={() => setActiveTabMode('regua')}
              style={{
                padding: '0.55rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: activeTabMode === 'regua' ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                color: activeTabMode === 'regua' ? '#991B1B' : '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: activeTabMode === 'regua' ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Zap size={16} color={activeTabMode === 'regua' ? '#991B1B' : '#FFFFFF'} />
              Régua Automática de Disparos (D-1 & D-0)
              <span style={{ 
                background: activeTabMode === 'regua' ? '#FEE2E2' : 'rgba(0,0,0,0.25)', 
                color: activeTabMode === 'regua' ? '#991B1B' : '#FFFFFF', 
                fontSize: '0.72rem', 
                padding: '0.1rem 0.45rem', 
                borderRadius: 'var(--radius-full)', 
                fontWeight: 800 
              }}>
                {dMinusOneVisits.length + dZeroAndOverdueVisits.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTabMode('all-plans')}
              style={{
                padding: '0.55rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: activeTabMode === 'all-plans' ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                color: activeTabMode === 'all-plans' ? '#991B1B' : '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: activeTabMode === 'all-plans' ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Layers size={16} />
              Todos os Planos de Ação ({allActionPlanRows.length})
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.75rem 2rem' }}>

          {/* ======================================================== */}
          {/* MODO 1: RÉGUA AUTOMÁTICA DE MENOR PRAZO (D-1 & D-0)       */}
          {/* ======================================================== */}
          {activeTabMode === 'regua' && (
            <div>
              {/* Cards de Resumo da Régua */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                
                {/* Card 1: D-1 Alerta Preventivo (Faltam 24h) */}
                <div 
                  onClick={() => setReguaFilter(reguaFilter === 'd-1' ? 'all' : 'd-1')}
                  style={{
                    background: reguaFilter === 'd-1' ? '#FEF9C3' : '#FFFBEB',
                    border: '2px solid #F59E0B',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    cursor: 'pointer',
                    boxShadow: reguaFilter === 'd-1' ? '0 4px 12px rgba(245,158,11,0.25)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#B45309', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={14} /> Nível 1 • Alerta de Prevenção (D-1)
                      </div>
                      <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#92400E', marginTop: '0.35rem' }}>
                        {dMinusOneVisits.length} unidade(s)
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', background: '#FDE68A', color: '#78350F', padding: '0.25rem 0.55rem', borderRadius: 'var(--radius-full)', fontWeight: 800 }}>
                      Faltam 24h
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#92400E', margin: '0.5rem 0 0' }}>
                    Menor prazo da visita expira amanhã. Disparo preventivo para alertar e evitar atraso.
                  </p>
                </div>

                {/* Card 2: D-0 / Atraso Escalação de Atenção Total */}
                <div 
                  onClick={() => setReguaFilter(reguaFilter === 'd-0' ? 'all' : 'd-0')}
                  style={{
                    background: reguaFilter === 'd-0' ? '#FEE2E2' : '#FEF2F2',
                    border: '2px solid #EF4444',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    cursor: 'pointer',
                    boxShadow: reguaFilter === 'd-0' ? '0 4px 12px rgba(239,68,68,0.25)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#991B1B', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Flame size={14} /> Nível 2 • Atenção Total e Absoluta (D-0)
                      </div>
                      <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#7F1D1D', marginTop: '0.35rem' }}>
                        {dZeroAndOverdueVisits.length} unidade(s)
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', background: '#FCA5A5', color: '#7F1D1D', padding: '0.25rem 0.55rem', borderRadius: 'var(--radius-full)', fontWeight: 800 }}>
                      Vencido / Hoje
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#7F1D1D', margin: '0.5rem 0 0' }}>
                    Prazo esgotado! Escalação imediata para Franqueado, Consultor, Gerente Regional e Gerente Nacional.
                  </p>
                </div>

              </div>

              {/* Informação da Cadeia Hierárquica */}
              <div style={{ background: '#FAF8F5', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-brown)' }}>
                  <Users size={16} /> Cadeia de Destinatários Configurada:
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                  <span style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)' }}>
                    🏬 Franqueado da Loja
                  </span>
                  <span style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)' }}>
                    👨‍💼 Consultor(a) de Negócios
                  </span>
                  <span style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)' }}>
                    🏢 Gerente Regional (Rodrigo / André / Anaketlim)
                  </span>
                  <span style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)', color: '#991B1B', fontWeight: 700 }}>
                    🌐 Gerente Nacional (Liliane Cury)
                  </span>
                </div>
              </div>

              {/* Lista de Visitas com SLA Crítico */}
              {filteredReguaVisits.length === 0 ? (
                <div style={{ padding: '3.5rem 2rem', textAlign: 'center', background: '#FAF8F5', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-strong)' }}>
                  <CheckCircle2 size={44} color="#166534" style={{ margin: '0 auto 0.75rem' }} />
                  <h3 style={{ fontSize: '1.15rem', color: '#166534', margin: 0 }}>
                    {reguaFilter === 'd-1' ? 'Nenhuma unidade com menor prazo vencendo amanhã!' : reguaFilter === 'd-0' ? 'Nenhuma unidade com prazos esgotados!' : 'Nenhuma unidade na régua de alertas no momento!'}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    Todas as unidades estão com seus prazos e planos de ação em dia.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {filteredReguaVisits.map((item) => {
                    const isItemD1 = item.sla.isDMinusOne;
                    const isItemD0 = item.sla.isDZeroOrOverdue;

                    return (
                      <div 
                        key={item.visit.id}
                        style={{
                          background: '#FFFFFF',
                          border: `1.5px solid ${isItemD0 ? '#EF4444' : '#F59E0B'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '1.15rem 1.25rem',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem'
                        }}
                      >
                        {/* Linha 1: Dados da Loja + Badge de Gravidade */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Store size={18} color="var(--primary-brown)" />
                              <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
                                {item.store?.name}
                              </strong>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                (Código RP: {item.store?.code})
                              </span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                              📍 {item.store?.city} - {item.store?.state} &bull; Franqueado(a): <strong>{item.store?.franchisee || 'Franqueado Oficial'}</strong>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {isItemD1 && (
                              <span style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #F59E0B', fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Clock size={13} /> 🟡 Alerta Preventivo (D-1 • Faltam 24h)
                              </span>
                            )}
                            {isItemD0 && (
                              <span style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #EF4444', fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Flame size={13} /> 🚨 Escalação de Atenção Total ({item.sla.daysOverdue === 0 ? 'Vence Hoje' : `${item.sla.daysOverdue}d em atraso`})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Linha 2: Menor Prazo & Resumo de Planos */}
                        <div style={{ background: '#FAF8F5', padding: '0.65rem 0.85rem', borderRadius: '4px', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Menor Prazo desta Visita:</span>{' '}
                            <strong style={{ color: isItemD0 ? '#991B1B' : '#B45309', fontSize: '0.86rem' }}>
                              {item.sla.formattedMinDueDate}
                            </strong>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                              ({item.sla.openPlansCount} plano(s) de ação pendente(s))
                            </span>
                          </div>
                          
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                            👨‍💼 Consultor(a): <strong>{item.consultant?.name || 'Não atribuído'}</strong> &bull; Regional: <strong>{item.regionalManager?.name || 'Regional'}</strong>
                          </div>
                        </div>

                        {/* Linha 3: Botões de Ação de Disparo */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            onClick={() => setSelectedVisitForReport(item.visit)}
                            title="Ver Laudo Completo da Auditoria"
                          >
                            <FileText size={13} /> Ver Laudo Completo
                          </button>

                          {isItemD1 && (
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ backgroundColor: '#D97706', borderColor: '#D97706', color: '#FFFFFF', fontSize: '0.75rem', padding: '0.35rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                              onClick={() => setNotificationConfig({ type: 'prevention', visitItem: item })}
                            >
                              <Send size={13} /> Disparar Alerta Preventivo (D-1)
                            </button>
                          )}

                          {isItemD0 && (
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ backgroundColor: '#991B1B', borderColor: '#991B1B', color: '#FFFFFF', fontSize: '0.75rem', padding: '0.35rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                              onClick={() => setNotificationConfig({ type: 'critical', visitItem: item })}
                            >
                              <ShieldAlert size={13} /> Disparar Escalação de Atenção Total (D-0)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* MODO 2: TABELA COMPLETA COM FILTROS AVANÇADOS             */}
          {/* ======================================================== */}
          {activeTabMode === 'all-plans' && (
            <div>
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

              {/* Table of Action Plans */}
              {filteredPlans.length === 0 ? (
                <div style={{ padding: '3.5rem 2rem', textAlign: 'center', background: '#FAF8F5', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-strong)' }}>
                  <CheckCircle2 size={44} color="#166534" style={{ margin: '0 auto 0.75rem' }} />
                  <h3 style={{ fontSize: '1.15rem', color: '#166534' }}>Nenhum plano de ação encontrado!</h3>
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
                              onClick={() => handleOpenFromTableRow(plan)}
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
          )}

        </div>

        {/* Modal Secundário de Disparo de E-mail / WhatsApp */}
        {notificationConfig && selectedVisitItem && (
          <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setNotificationConfig(null)}>
            <div 
              className="modal-card" 
              style={{ maxWidth: '680px', padding: '1.75rem', borderRadius: 'var(--radius-lg)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', color: isPrevention ? '#B45309' : '#991B1B', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontWeight: 800 }}>
                  {isPrevention ? <Clock size={20} /> : <ShieldAlert size={20} />}
                  {isPrevention ? 'Disparo de Alerta Preventivo (D-1 • Faltam 24h)' : 'Disparo de Escalação de Atenção Total (D-0 / Prazo Esgotado)'}
                </h3>
                <button 
                  onClick={() => setNotificationConfig(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Store & Overdue Summary */}
              <div style={{ background: isPrevention ? '#FFFBEB' : '#FEF2F2', border: `1px solid ${isPrevention ? '#FCD34D' : '#FCA5A5'}`, padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ fontSize: '1.05rem', color: isPrevention ? '#92400E' : '#7F1D1D' }}>
                      {selectedVisitItem.store?.name}
                    </strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Código RP: <strong>{selectedVisitItem.store?.code}</strong> &bull; {selectedVisitItem.store?.city}/{selectedVisitItem.store?.state}
                    </div>
                  </div>
                  <span className={`badge ${isPrevention ? 'badge-media' : 'badge-critica'}`} style={{ fontSize: '0.75rem' }}>
                    {selectedVisitItem.sla?.openPlansCount} plano(s) pendente(s)
                  </span>
                </div>
              </div>

              {/* Destinatários Oficiais Selecionáveis */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ marginBottom: '0.5rem' }}>
                  Cadeia Hierárquica Notificada (Selecione os destinatários):
                </label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', padding: '0.4rem 0.6rem', background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '4px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={includeFranchisee} 
                      onChange={(e) => setIncludeFranchisee(e.target.checked)} 
                    />
                    <div>
                      <strong>1. Franqueado(a) da Loja:</strong> {selectedVisitItem.store?.franchisee || 'Franqueado'} ({selectedVisitItem.store?.email || 'sem e-mail'})
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', padding: '0.4rem 0.6rem', background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '4px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={includeConsultant} 
                      onChange={(e) => setIncludeConsultant(e.target.checked)} 
                    />
                    <div>
                      <strong>2. Consultor(a) de Negócios:</strong> {selectedVisitItem.consultant?.name || 'Não atribuído'} ({selectedVisitItem.consultant?.email || 'sem e-mail'})
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', padding: '0.4rem 0.6rem', background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '4px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={includeRegional} 
                      onChange={(e) => setIncludeRegional(e.target.checked)} 
                    />
                    <div>
                      <strong>3. Gerente Regional:</strong> {selectedVisitItem.regionalManager?.name || 'Gerência Regional'} ({selectedVisitItem.regionalManager?.email || 'sem e-mail'})
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', padding: '0.4rem 0.6rem', background: '#FFFFFF', border: '1.5px solid #991B1B', borderRadius: '4px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={includeNational} 
                      onChange={(e) => setIncludeNational(e.target.checked)} 
                    />
                    <div>
                      <strong style={{ color: '#991B1B' }}>4. Gerente Nacional:</strong> {nationalManager?.name} ({nationalManager?.email})
                    </div>
                  </label>
                </div>
              </div>

              {/* Preview da Mensagem */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Prévia do E-mail Oficial:</label>
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
                  rows={7}
                  style={{ width: '100%', fontSize: '0.76rem', fontFamily: 'monospace', backgroundColor: '#FAF8F5', resize: 'vertical' }}
                />
              </div>

              {/* Botões de Ação de Disparo */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setNotificationConfig(null)}
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
                  style={{ 
                    backgroundColor: isPrevention ? '#D97706' : '#991B1B', 
                    borderColor: isPrevention ? '#D97706' : '#991B1B', 
                    color: '#FFFFFF', 
                    gap: '0.4rem' 
                  }}
                >
                  <Send size={15} /> Disparar E-mail (Todos em Cópia)
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
