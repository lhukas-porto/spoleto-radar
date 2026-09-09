import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatPhoneNumber, formatBrDate } from '../utils/dateHelpers';
import { 
  X, 
  Users, 
  Store, 
  Phone, 
  Mail, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Award, 
  Building2, 
  ExternalLink, 
  MessageCircle, 
  Eye, 
  AlertTriangle, 
  TrendingUp, 
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export default function FranchiseeProfileModal() {
  const { 
    selectedFranchiseeForProfile, 
    setSelectedFranchiseeForProfile,
    franchisees = [],
    stores = [], 
    visits = [], 
    consultants = [],
    getStoreFranchisees,
    setSelectedStoreForProfile,
    setSelectedVisitForReport
  } = useApp();

  const [activeTab, setActiveTab] = useState('stores'); // 'stores' | 'visits' | 'actions'
  const [actionFilter, setActionFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'DONE'
  const [zoomedPhoto, setZoomedPhoto] = useState(null);

  if (!selectedFranchiseeForProfile) return null;

  // Resolve o franqueado mais atualizado a partir do state global
  const target = selectedFranchiseeForProfile;
  const fran = franchisees.find(f => f.id === target.id || (f.name && f.name.trim().toUpperCase() === target.name?.trim().toUpperCase())) || target;

  // Lojas vinculadas a este franqueado
  const franStores = stores.filter(s => {
    if (fran.id && fran.assignedStoreIds?.includes(s.id)) return true;
    if (fran.id && getStoreFranchisees) {
      const linked = getStoreFranchisees(s.id);
      if (linked.some(f => f.id === fran.id)) return true;
    }
    if (s.franchisee && fran.name && s.franchisee.trim().toUpperCase() === fran.name.trim().toUpperCase()) return true;
    return false;
  });

  const franStoreIds = new Set(franStores.map(s => s.id));

  // Visitas realizadas nas lojas deste franqueado
  const franVisits = visits
    .filter(v => franStoreIds.has(v.storeId))
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  // Planos de Ação das visitas deste franqueado
  const allActionPlans = [];
  franVisits.forEach(v => {
    const st = franStores.find(s => s.id === v.storeId);
    (v.diagnostics || []).forEach(d => {
      if (d.actionPlan && (d.actionPlan.what || d.actionPlan.action)) {
        const currentStatus = (d.actionPlan.status || 'NÃO INICIADO').toUpperCase();
        allActionPlans.push({
          id: `${v.id}-${d.id}`,
          visitId: v.id,
          visitDate: v.date,
          storeName: st?.name || v.storeName || 'Loja Spoleto',
          storeCode: st?.code || 'SPO',
          action: d.actionPlan.what || d.actionPlan.action,
          responsible: d.actionPlan.who || d.actionPlan.responsible || 'Gerente',
          deadline: d.actionPlan.deadline || 'Imediato',
          status: currentStatus,
          isCompleted: currentStatus === 'CONCLUÍDO' || currentStatus === 'VALIDADO'
        });
      }
    });
  });

  const pendingActions = allActionPlans.filter(a => !a.isCompleted);
  const completedActions = allActionPlans.filter(a => a.isCompleted);

  // Média de pontuação das visitas
  const scoredVisits = franVisits.filter(v => v.score !== undefined && v.score !== null && !isNaN(Number(v.score)));
  const avgScore = scoredVisits.length > 0 
    ? (scoredVisits.reduce((acc, v) => acc + Number(v.score), 0) / scoredVisits.length).toFixed(1)
    : null;

  const cleanPhone = (fran.phone || '').replace(/\D/g, '');

  const filteredActions = allActionPlans.filter(a => {
    if (actionFilter === 'PENDING') return !a.isCompleted;
    if (actionFilter === 'DONE') return a.isCompleted;
    return true;
  });

  return (
    <div 
      className="modal-overlay"
      style={{ zIndex: 11000, backgroundColor: 'rgba(15, 23, 42, 0.72)', backdropFilter: 'blur(5px)' }}
      onClick={() => setSelectedFranchiseeForProfile(null)}
    >
      <div 
        className="modal-card" 
        style={{ 
          maxWidth: '760px', 
          width: '94%', 
          maxHeight: '90vh', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: 0, 
          borderRadius: '18px', 
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================================================================
            HEADER HERO EXECUTIVO
            ========================================================================= */}
        <div style={{
          background: 'linear-gradient(135deg, #3E2415 0%, #5D3826 60%, #854D0E 100%)',
          color: '#FFFFFF',
          padding: '1.6rem 1.75rem',
          position: 'relative'
        }}>
          <button 
            onClick={() => setSelectedFranchiseeForProfile(null)}
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
          >
            <X size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', flexWrap: 'wrap' }}>
            {/* Avatar Dourado com Foto / Inicial e Zoom ao Clicar */}
            <div 
              onClick={() => {
                setZoomedPhoto({
                  url: fran.photoUrl || null,
                  name: fran.name,
                  role: 'SÓCIO FRANQUEADO SPOLETO'
                });
              }}
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: fran.photoUrl ? '#FFFFFF' : '#FEF3C7',
                color: '#B45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.85rem',
                border: fran.photoUrl ? '3px solid var(--accent-gold)' : '3px solid #FDE68A',
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              title="Clique para ver a foto ampliada"
            >
              {fran.photoUrl ? (
                <img src={fran.photoUrl} alt={fran.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                fran.name?.charAt(0).toUpperCase() || 'F'
              )}
            </div>

            <div style={{ flex: 1, minWidth: '240px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                <span style={{
                  backgroundColor: '#FEF3C7',
                  color: '#B45309',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}>
                  <Award size={12} /> SÓCIO FRANQUEADO SPOLETO
                </span>
                <span style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  padding: '0.2rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.68rem',
                  fontWeight: 700
                }}>
                  VISÃO 360°
                </span>
              </div>

              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em', color: '#FFFFFF' }}>
                {fran.name}
              </h1>

              {/* Contatos em pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.65rem', flexWrap: 'wrap' }}>
                {fran.phone ? (
                  <a 
                    href={`https://wa.me/55${cleanPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.35rem 0.75rem',
                      background: 'rgba(16, 185, 129, 0.25)',
                      border: '1px solid #10B981',
                      borderRadius: '8px',
                      color: '#ECFDF5',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      textDecoration: 'none'
                    }}
                    title="Iniciar conversa no WhatsApp"
                  >
                    <MessageCircle size={14} color="#6EE7B7" />
                    {formatPhoneNumber(fran.phone)}
                  </a>
                ) : (
                  <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.7)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Phone size={12} /> Sem telefone
                  </span>
                )}

                {(() => {
                  const displayEmail = (fran.email || '').includes(',') ? fran.email.split(',')[0].trim() : (fran.email || '').trim();
                  return displayEmail ? (
                    <a 
                      href={`mailto:${displayEmail}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.35rem 0.75rem',
                        background: 'rgba(59, 130, 246, 0.25)',
                        border: '1px solid #60A5FA',
                        borderRadius: '8px',
                        color: '#EFF6FF',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                      title="Enviar e-mail para o franqueado"
                    >
                      <Mail size={14} color="#93C5FD" />
                      {displayEmail}
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.7)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Mail size={12} /> Sem e-mail
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            MINI KPIS EXECUTIVOS
            ========================================================================= */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.75rem',
          padding: '1rem 1.5rem',
          backgroundColor: '#FAF8F5',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: '10px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
              <Store size={12} color="var(--primary-brown)" /> Lojas na Rede
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-brown)', marginTop: '0.2rem' }}>
              {franStores.length}
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: '10px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
              <Calendar size={12} color="var(--primary-brown)" /> Visitas Feitas
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {franVisits.length}
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: '10px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
              <TrendingUp size={12} color="#16A34A" /> Pontuação Média
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: avgScore ? '#16A34A' : 'var(--text-muted)', marginTop: '0.2rem' }}>
              {avgScore ? `${avgScore}%` : '--'}
            </div>
          </div>

          <div style={{ 
            background: pendingActions.length > 0 ? '#FEF2F2' : '#F0FDF4', 
            padding: '0.75rem', 
            borderRadius: '10px', 
            border: `1px solid ${pendingActions.length > 0 ? '#FECACA' : '#BBF7D0'}`, 
            textAlign: 'center' 
          }}>
            <div style={{ fontSize: '0.68rem', color: pendingActions.length > 0 ? '#991B1B' : '#166534', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
              <FileText size={12} color={pendingActions.length > 0 ? '#DC2626' : '#16A34A'} /> Ações Pendentes
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: pendingActions.length > 0 ? '#DC2626' : '#16A34A', marginTop: '0.2rem' }}>
              {pendingActions.length}
            </div>
          </div>
        </div>

        {/* =========================================================================
            ABAS DE CONTEÚDO
            ========================================================================= */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 1.5rem',
          backgroundColor: '#FFFFFF'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('stores')}
            style={{
              padding: '0.75rem 1.1rem',
              border: 'none',
              background: 'none',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              color: activeTab === 'stores' ? 'var(--primary-brown)' : 'var(--text-muted)',
              borderBottom: activeTab === 'stores' ? '2.5px solid var(--primary-brown)' : '2.5px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
          >
            <Store size={15} /> Restaurantes ({franStores.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visits')}
            style={{
              padding: '0.75rem 1.1rem',
              border: 'none',
              background: 'none',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              color: activeTab === 'visits' ? 'var(--primary-brown)' : 'var(--text-muted)',
              borderBottom: activeTab === 'visits' ? '2.5px solid var(--primary-brown)' : '2.5px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
          >
            <Calendar size={15} /> Histórico de Visitas ({franVisits.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('actions')}
            style={{
              padding: '0.75rem 1.1rem',
              border: 'none',
              background: 'none',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              color: activeTab === 'actions' ? 'var(--primary-brown)' : 'var(--text-muted)',
              borderBottom: activeTab === 'actions' ? '2.5px solid var(--primary-brown)' : '2.5px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
          >
            <CheckCircle2 size={15} /> Planos de Ação ({allActionPlans.length})
          </button>
        </div>

        {/* =========================================================================
            CORPO DA ABA SELECIONADA
            ========================================================================= */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', backgroundColor: '#FDFCFB' }}>
          
          {/* ABA 1: RESTAURANTES DA REDE SOB GESTÃO */}
          {activeTab === 'stores' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {franStores.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: '#FFFFFF', borderRadius: '12px', border: '1px dashed var(--border-subtle)' }}>
                  <Store size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Nenhum restaurante vinculado diretamente a este franqueado no momento.
                  </p>
                </div>
              ) : (
                franStores.map(store => {
                  const consultant = consultants.find(c => c.id === store.consultantId);
                  const storeVisitsCount = visits.filter(v => v.storeId === store.id).length;

                  return (
                    <div 
                      key={store.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1rem',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '10px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        gap: '0.85rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <span style={{
                          padding: '0.3rem 0.6rem',
                          backgroundColor: '#FEF3C7',
                          color: '#B45309',
                          borderRadius: '6px',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          letterSpacing: '0.04em'
                        }}>
                          {store.code}
                        </span>

                        <div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            {store.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            📍 {store.city} - {store.state} &bull; {store.locationType || 'Shopping'} &bull; {store.workShift || '6x1'}
                          </div>
                          {consultant && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--primary-brown)', marginTop: '0.15rem', fontWeight: 600 }}>
                              👨‍💼 Consultor: <strong>{consultant.name}</strong>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {storeVisitsCount} {storeVisitsCount === 1 ? 'visita' : 'visitas'}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFranchiseeForProfile(null);
                            setSelectedStoreForProfile(store);
                          }}
                          style={{
                            padding: '0.4rem 0.85rem',
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
                          title={`Abrir Ficha 360° da Loja ${store.name}`}
                        >
                          <Eye size={13} /> Ficha da Loja
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ABA 2: HISTÓRICO DE VISITAS */}
          {activeTab === 'visits' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {franVisits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: '#FFFFFF', borderRadius: '12px', border: '1px dashed var(--border-subtle)' }}>
                  <Calendar size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Nenhuma visita registrada para as lojas deste franqueado.
                  </p>
                </div>
              ) : (
                franVisits.map(visit => {
                  const store = franStores.find(s => s.id === visit.storeId);
                  const consultant = consultants.find(c => c.id === visit.consultantId);
                  const scoreNum = Number(visit.score);
                  const hasScore = !isNaN(scoreNum);

                  return (
                    <div 
                      key={visit.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1rem',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '10px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            {store?.name || visit.storeName || 'Loja Spoleto'}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            ({store?.code || 'SPO'})
                          </span>
                          <span style={{
                            fontSize: '0.68rem',
                            backgroundColor: '#F3F4F6',
                            color: '#374151',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            fontWeight: 700
                          }}>
                            {visit.visitType || 'Visita'}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          📅 {formatBrDate(visit.date)} &bull; Consultor: <strong>{consultant?.name || visit.consultantName || 'Spoleto'}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        {hasScore && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{
                              fontSize: '0.95rem',
                              fontWeight: 900,
                              color: scoreNum >= 85 ? '#16A34A' : scoreNum >= 70 ? '#D97706' : '#DC2626'
                            }}>
                              {scoreNum.toFixed(0)}%
                            </div>
                            <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>Conformidade</div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFranchiseeForProfile(null);
                            setSelectedVisitForReport(visit);
                          }}
                          style={{
                            padding: '0.4rem 0.8rem',
                            backgroundColor: 'var(--primary-brown)',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#FFFFFF',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                          title="Ver Relatório Completo da Visita"
                        >
                          <FileText size={13} /> Relatório
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ABA 3: PLANOS DE AÇÃO */}
          {activeTab === 'actions' && (
            <div>
              {/* Filtros Rápidos de Status */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setActionFilter('ALL')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-subtle)',
                    background: actionFilter === 'ALL' ? 'var(--primary-brown)' : '#FFFFFF',
                    color: actionFilter === 'ALL' ? '#FFFFFF' : 'var(--text-main)',
                    cursor: 'pointer'
                  }}
                >
                  Todos ({allActionPlans.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActionFilter('PENDING')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid #FECACA',
                    background: actionFilter === 'PENDING' ? '#DC2626' : '#FEF2F2',
                    color: actionFilter === 'PENDING' ? '#FFFFFF' : '#991B1B',
                    cursor: 'pointer'
                  }}
                >
                  Pendentes ({pendingActions.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActionFilter('DONE')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid #BBF7D0',
                    background: actionFilter === 'DONE' ? '#16A34A' : '#F0FDF4',
                    color: actionFilter === 'DONE' ? '#FFFFFF' : '#166534',
                    cursor: 'pointer'
                  }}
                >
                  Concluídos ({completedActions.length})
                </button>
              </div>

              {filteredActions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: '#FFFFFF', borderRadius: '12px', border: '1px dashed var(--border-subtle)' }}>
                  <CheckCircle2 size={32} color="#16A34A" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {actionFilter === 'PENDING' 
                      ? 'Nenhum plano de ação pendente! Todas as unidades em conformidade.'
                      : 'Nenhum plano de ação encontrado nesta categoria.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {filteredActions.map(act => (
                    <div 
                      key={act.id}
                      style={{
                        padding: '0.85rem 1rem',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '10px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            padding: '0.15rem 0.45rem',
                            backgroundColor: '#F3F4F6',
                            color: '#374151',
                            borderRadius: '4px',
                            fontWeight: 800,
                            fontSize: '0.72rem'
                          }}>
                            {act.storeCode}
                          </span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                            {act.storeName}
                          </span>
                        </div>

                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.55rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: act.isCompleted ? '#DCFCE7' : '#FEE2E2',
                          color: act.isCompleted ? '#166534' : '#991B1B'
                        }}>
                          {act.status}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                        {act.action}
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        <span>👤 Responsável: <strong>{act.responsible}</strong></span>
                        <span>⏰ Prazo: <strong>{act.deadline}</strong></span>
                        <span>📅 Visita: {formatBrDate(act.visitDate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* =========================================================================
            FOOTER DO MODAL
            ========================================================================= */}
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: '#FAF8F5',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Franqueado Spoleto &bull; Gestão Estratégica 360°
          </span>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => setSelectedFranchiseeForProfile(null)}
            style={{ fontSize: '0.84rem', padding: '0.45rem 1.5rem' }}
          >
            Fechar
          </button>
        </div>

      </div>

      {/* Modal de Foto Ampliada com Zoom Centralizado */}
      {zoomedPhoto && (
        <div 
          className="modal-backdrop" 
          onClick={() => setZoomedPhoto(null)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 10001,
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
    </div>
  );
}
