import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bell, 
  Clock, 
  Flame, 
  CheckCircle2, 
  FileText, 
  Store, 
  X, 
  ExternalLink,
  Check,
  ChevronRight,
  ShieldAlert,
  Zap
} from 'lucide-react';
import { getVisitCriticalSla, formatBrDate } from '../utils/dateHelpers';

export default function NotificationBell() {
  const { 
    visits, 
    stores, 
    consultants, 
    categories, 
    setSelectedVisitForReport, 
    setSelectedStoreForProfile,
    setIsOverdueModalOpen 
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'sla' | 'visits' | 'completed'
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem('spoleto_read_notifs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute smart notifications from active visits and stores
  const notifications = [];

  // 1. SLA Notifications (D-1 e D-0)
  visits.forEach(v => {
    const store = stores.find(s => s.id === v.storeId);
    const consultant = consultants.find(c => c.id === v.consultantId);
    const sla = getVisitCriticalSla(v, categories);

    if (sla && sla.hasOpenPlans) {
      if (sla.isDMinusOne) {
        notifications.push({
          id: `sla-d1-${v.id}`,
          type: 'sla',
          level: 'd-1',
          title: `⚠️ Alerta Preventivo (D-1): ${store?.name || 'Unidade'}`,
          description: `O menor prazo vence amanhã (${sla.formattedMinDueDate}) com ${sla.openPlansCount} plano(s) pendente(s).`,
          timestamp: 'Faltam 24h',
          targetVisit: v,
          targetStore: store,
          badgeColor: '#F59E0B',
          badgeBg: '#FEF3C7',
          icon: <Clock size={15} color="#B45309" />
        });
      } else if (sla.isDZeroOrOverdue) {
        notifications.push({
          id: `sla-d0-${v.id}`,
          type: 'sla',
          level: 'd-0',
          title: `🚨 Atenção Total: ${store?.name || 'Unidade'}`,
          description: `Prazo limite esgotado (${sla.formattedMinDueDate})! ${sla.daysOverdue > 0 ? `${sla.daysOverdue}d em atraso.` : 'Vence hoje.'}`,
          timestamp: sla.daysOverdue > 0 ? `${sla.daysOverdue}d atrasado` : 'Vence Hoje',
          targetVisit: v,
          targetStore: store,
          badgeColor: '#EF4444',
          badgeBg: '#FEE2E2',
          icon: <Flame size={15} color="#991B1B" />
        });
      }
    }
  });

  // 2. Recent Visits (últimas 5)
  const sortedVisits = [...visits].sort((a, b) => new Date(b.date) - new Date(a.date));
  sortedVisits.slice(0, 5).forEach(v => {
    const store = stores.find(s => s.id === v.storeId);
    const consultant = consultants.find(c => c.id === v.consultantId);
    const diagCount = (v.diagnostics || []).length;

    notifications.push({
      id: `visit-${v.id}`,
      type: 'visits',
      title: `📋 Nova Visita: ${store?.name || 'Unidade Spoleto'}`,
      description: `Laudo emitido por ${consultant?.name || 'Consultor'} com ${diagCount} plano(s) de ação.`,
      timestamp: formatBrDate(v.date),
      targetVisit: v,
      targetStore: store,
      badgeColor: '#3B82F6',
      badgeBg: '#EFF6FF',
      icon: <FileText size={15} color="#1E40AF" />
    });
  });

  // 3. Completed Action Plans (planos concluídos com sucesso)
  visits.forEach(v => {
    const store = stores.find(s => s.id === v.storeId);
    (v.diagnostics || []).forEach(d => {
      if ((d.actionPlan?.status || '').toUpperCase() === 'CONCLUÍDO') {
        notifications.push({
          id: `done-${v.id}-${d.id}`,
          type: 'completed',
          title: `✅ Plano Concluído: ${store?.name || 'Unidade'}`,
          description: `Ação "${d.actionPlan?.action?.slice(0, 50)}..." foi finalizada com sucesso!`,
          timestamp: 'Concluído',
          targetVisit: v,
          targetStore: store,
          badgeColor: '#10B981',
          badgeBg: '#ECFDF5',
          icon: <CheckCircle2 size={15} color="#065F46" />
        });
      }
    });
  });

  // Filtrar notificações por tipo
  const filteredNotifs = notifications.filter(n => {
    if (filterType === 'all') return true;
    return n.type === filterType;
  });

  // Contagem de não lidas
  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

  const handleMarkAllRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadIds(allIds);
    localStorage.setItem('spoleto_read_notifs', JSON.stringify(allIds));
  };

  const handleItemClick = (notif) => {
    // Marca como lida
    if (!readIds.includes(notif.id)) {
      const updated = [...readIds, notif.id];
      setReadIds(updated);
      localStorage.setItem('spoleto_read_notifs', JSON.stringify(updated));
    }

    setIsOpen(false);

    if (notif.type === 'sla') {
      setIsOverdueModalOpen(true);
    } else if (notif.targetVisit) {
      setSelectedVisitForReport(notif.targetVisit);
    } else if (notif.targetStore) {
      setSelectedStoreForProfile(notif.targetStore);
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Botão do Sino */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: isOpen ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          color: '#FFFFFF',
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
        title="Central de Atividades & Alertas em Tempo Real"
      >
        <Bell size={18} />
        
        {/* Badge Numérico com Efeito Pulsante */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-3px',
            right: '-3px',
            background: '#EF4444',
            color: '#FFFFFF',
            fontSize: '0.65rem',
            fontWeight: 800,
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #5D3826',
            boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover / Dropdown Flutuante */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          right: 0,
          width: '380px',
          maxWidth: '90vw',
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          border: '1px solid var(--border-subtle)',
          zIndex: 10080,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header do Popover */}
          <div style={{
            background: 'linear-gradient(135deg, #5D3826 0%, #78350F 100%)',
            padding: '1rem 1.25rem',
            color: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={17} color="var(--accent-gold)" />
              <strong style={{ fontSize: '0.92rem' }}>Central de Atividades</strong>
              {unreadCount > 0 && (
                <span style={{ background: '#EF4444', fontSize: '0.68rem', padding: '0.1rem 0.45rem', borderRadius: 'var(--radius-full)', fontWeight: 800 }}>
                  {unreadCount} nova(s)
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FDE68A',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  padding: 0
                }}
              >
                <Check size={12} /> Marcar lidas
              </button>
            )}
          </div>

          {/* Filtros em Chips */}
          <div style={{ display: 'flex', gap: '0.35rem', padding: '0.65rem 0.85rem', background: '#FAF8F5', borderBottom: '1px solid var(--border-subtle)', overflowX: 'auto' }}>
            <button
              type="button"
              onClick={() => setFilterType('all')}
              style={{
                fontSize: '0.72rem',
                padding: '0.25rem 0.55rem',
                borderRadius: 'var(--radius-full)',
                border: filterType === 'all' ? '1px solid var(--primary-brown)' : '1px solid var(--border-subtle)',
                background: filterType === 'all' ? 'var(--primary-brown)' : '#FFFFFF',
                color: filterType === 'all' ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Todas ({notifications.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterType('sla')}
              style={{
                fontSize: '0.72rem',
                padding: '0.25rem 0.55rem',
                borderRadius: 'var(--radius-full)',
                border: filterType === 'sla' ? '1px solid #EF4444' : '1px solid var(--border-subtle)',
                background: filterType === 'sla' ? '#EF4444' : '#FFFFFF',
                color: filterType === 'sla' ? '#FFFFFF' : '#991B1B',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              🚨 Alertas SLA ({notifications.filter(n => n.type === 'sla').length})
            </button>

            <button
              type="button"
              onClick={() => setFilterType('visits')}
              style={{
                fontSize: '0.72rem',
                padding: '0.25rem 0.55rem',
                borderRadius: 'var(--radius-full)',
                border: filterType === 'visits' ? '1px solid #1E40AF' : '1px solid var(--border-subtle)',
                background: filterType === 'visits' ? '#1E40AF' : '#FFFFFF',
                color: filterType === 'visits' ? '#FFFFFF' : '#1E40AF',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              📋 Visitas
            </button>

            <button
              type="button"
              onClick={() => setFilterType('completed')}
              style={{
                fontSize: '0.72rem',
                padding: '0.25rem 0.55rem',
                borderRadius: 'var(--radius-full)',
                border: filterType === 'completed' ? '1px solid #10B981' : '1px solid var(--border-subtle)',
                background: filterType === 'completed' ? '#10B981' : '#FFFFFF',
                color: filterType === 'completed' ? '#FFFFFF' : '#065F46',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              ✅ Concluídas
            </button>
          </div>

          {/* Lista de Notificações */}
          <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '0.5rem 0' }}>
            {filteredNotifs.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Nenhuma notificação nesta categoria.
              </div>
            ) : (
              filteredNotifs.map(notif => {
                const isRead = readIds.includes(notif.id);

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid var(--border-subtle)',
                      background: isRead ? '#FFFFFF' : '#FEFDFB',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'flex-start',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#FAF8F5'}
                    onMouseLeave={(e) => e.currentTarget.style.background = isRead ? '#FFFFFF' : '#FEFDFB'}
                  >
                    {/* Ícone com fundo colorido */}
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: notif.badgeBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      {notif.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.25rem' }}>
                        <strong style={{ fontSize: '0.82rem', color: isRead ? 'var(--text-main)' : 'var(--primary-brown)', display: 'block', lineHeight: 1.3 }}>
                          {notif.title}
                        </strong>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: 600 }}>
                          {notif.timestamp}
                        </span>
                      </div>

                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                        {notif.description}
                      </p>
                    </div>

                    <ChevronRight size={14} color="var(--text-muted)" style={{ marginTop: '8px', flexShrink: 0 }} />
                  </div>
                );
              })
            )}
          </div>

          {/* Footer do Popover */}
          <div style={{ padding: '0.6rem', textAlign: 'center', background: '#FAF8F5', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => { setIsOpen(false); setIsOverdueModalOpen(true); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary-brown)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              Abrir Central de Prazos & SLA Completa <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
