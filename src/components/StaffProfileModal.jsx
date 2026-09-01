import React from 'react';
import { useApp } from '../context/AppContext';
import { formatPhoneNumber } from '../utils/dateHelpers';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Store, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  ShieldCheck, 
  Layers, 
  Award,
  ExternalLink,
  MessageSquare,
  Users
} from 'lucide-react';

export default function StaffProfileModal() {
  const { 
    selectedStaffForProfile, 
    setSelectedStaffForProfile, 
    consultants, 
    stores, 
    visits, 
    setSelectedVisitForReport,
    setManagingSubordinatesLeader,
    setActiveTab 
  } = useApp();

  if (!selectedStaffForProfile) return null;

  const staff = selectedStaffForProfile;
  const role = staff.role || 'CONSULTOR';

  // Role details
  const getRoleBadge = (r) => {
    switch (r) {
      case 'DIRETORIA':
        return { label: 'Diretoria Executiva & Operações', color: '#991B1B', bg: '#FEE2E2', icon: '🏛️' };
      case 'GERENTE_NACIONAL':
        return { label: 'Gerência Nacional de Consultoria', color: '#1E40AF', bg: '#DBEAFE', icon: '🌐' };
      case 'GERENTE_REGIONAL':
        return { label: 'Gerência Regional Spoleto', color: '#854D0E', bg: '#FEF9C3', icon: '🏢' };
      case 'CONSULTOR':
      default:
        return { label: 'Consultoria de Negócios de Campo', color: '#166534', bg: '#DCFCE7', icon: '👨‍💼' };
    }
  };

  const roleInfo = getRoleBadge(role);

  // Find superior manager
  const superior = staff.reportsTo ? consultants.find(c => c.id === staff.reportsTo) : null;

  // Find subordinates (people reporting to this staff member)
  const subordinates = consultants.filter(c => c.reportsTo === staff.id);

  // Stores assigned (if consultant)
  const assignedStoreList = stores.filter(s => 
    s.consultantId === staff.id || 
    (staff.assignedStores && Array.isArray(staff.assignedStores) && staff.assignedStores.includes(s.id))
  );

  // Visits conducted by this staff member
  const staffVisits = visits.filter(v => v.consultantId === staff.id);

  // Calculate Action Plan Metrics for this person
  let totalActionPlans = 0;
  let completedActionPlans = 0;
  let overdueActionPlans = 0;

  staffVisits.forEach(v => {
    (v.diagnostics || []).forEach(d => {
      totalActionPlans++;
      const st = d.actionPlan?.status || 'NÃO INICIADO';
      if (st === 'CONCLUÍDO') {
        completedActionPlans++;
      } else {
        // Check if overdue
        const visitDate = new Date(v.date + 'T12:00:00');
        const now = new Date();
        const diffDays = Math.floor((now - visitDate) / (1000 * 60 * 60 * 24));
        if (diffDays > 7) overdueActionPlans++;
      }
    });
  });

  const completionRate = totalActionPlans > 0 
    ? Math.round((completedActionPlans / totalActionPlans) * 100) 
    : 100;

  // Clean WhatsApp number
  const cleanPhone = (staff.phone || '').replace(/\D/g, '');

  return (
    <div className="modal-overlay" onClick={() => setSelectedStaffForProfile(null)}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto', padding: '0', borderRadius: 'var(--radius-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Banner */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary-brown) 0%, var(--primary-brown-dark) 100%)',
          padding: '2rem 2rem 1.5rem',
          color: '#FFFFFF',
          position: 'relative',
          borderBottom: '3px solid var(--accent-gold)'
        }}>
          <button 
            onClick={() => setSelectedStaffForProfile(null)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#FFFFFF',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Fechar Ficha"
          >
            <X size={18} />
          </button>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Avatar / Photo */}
            <div style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              border: '3px solid var(--accent-gold)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {staff.photoUrl ? (
                <img 
                  src={staff.photoUrl} 
                  alt={staff.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'var(--primary-brown-light)',
                  color: 'var(--primary-brown)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 800
                }}>
                  {staff.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div style={{ flex: 1, minWidth: '240px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: roleInfo.bg,
                  color: roleInfo.color,
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}>
                  <span>{roleInfo.icon}</span> {roleInfo.label}
                </span>

                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: '#FFFFFF'
                }}>
                  {staff.region}
                </span>
              </div>

              <h2 style={{ fontSize: '1.45rem', color: '#FFFFFF', margin: 0, fontWeight: 800 }}>
                {staff.name}
              </h2>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.6rem', flexWrap: 'wrap', fontSize: '0.84rem' }}>
                {staff.email ? (
                  <a 
                    href={`mailto:${staff.email}`}
                    style={{ color: '#F6EFEA', display: 'flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}
                  >
                    <Mail size={14} color="var(--accent-gold)" /> {staff.email}
                  </a>
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Mail size={14} /> E-mail não informado
                  </span>
                )}

                {staff.phone ? (
                  <a 
                    href={`https://wa.me/55${cleanPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#F6EFEA', display: 'flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}
                  >
                    <Phone size={14} color="var(--accent-gold)" /> {formatPhoneNumber(staff.phone)}
                  </a>
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Phone size={14} /> Telefone não informado
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Quick KPIs Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: '#FAF8F5', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {role === 'CONSULTOR' ? 'Lojas Atribuídas' : 'Liderados Diretos'}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-brown)', marginTop: '0.15rem' }}>
                {role === 'CONSULTOR' ? assignedStoreList.length : subordinates.length}
              </div>
            </div>

            <div style={{ padding: '1rem', background: '#FAF8F5', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Visitas Realizadas</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-brown)', marginTop: '0.15rem' }}>
                {staffVisits.length}
              </div>
            </div>

            <div style={{ padding: '1rem', background: '#FAF8F5', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Resolução de Ações</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#166534', marginTop: '0.15rem' }}>
                {completionRate}%
              </div>
            </div>

            <div style={{ padding: '1rem', background: '#FAF8F5', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Planos em Atraso</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: overdueActionPlans > 0 ? 'var(--status-nao-iniciado-text)' : 'var(--text-main)', marginTop: '0.15rem' }}>
                {overdueActionPlans}
              </div>
            </div>
          </div>

          {/* Subordination / Hierarchy Box */}
          <div style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <Award size={18} color="var(--primary-brown)" /> Estrutura & Subordinação Organizacional
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {/* Superior Direto */}
              <div style={{ padding: '0.85rem', background: '#FAFAFA', borderRadius: 'var(--radius-sm)', border: '1px solid #E5E7EB' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                  Superior Imediato
                </span>
                {superior ? (
                  <div 
                    onClick={() => setSelectedStaffForProfile(superior)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--primary-brown)', display: 'block' }}>
                        {superior.name}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {superior.role?.replace(/_/g, ' ')} &bull; {superior.region}
                      </span>
                    </div>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </div>
                ) : (
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Nível Máximo de Diretoria (Reporta ao Conselho)
                  </span>
                )}
              </div>

              {/* Liderados / Equipe Direta */}
              <div style={{ padding: '0.85rem', background: '#FAFAFA', borderRadius: 'var(--radius-sm)', border: '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Liderados Diretos ({subordinates.length})
                  </span>
                  {role !== 'CONSULTOR' && (
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      onClick={() => setManagingSubordinatesLeader(staff)}
                      title="Atribuir ou remover liderados diretos"
                    >
                      <Users size={12} /> Atribuir Liderados
                    </button>
                  )}
                </div>

                {subordinates.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '140px', overflowY: 'auto' }}>
                    {subordinates.map(sub => (
                      <div 
                        key={sub.id}
                        onClick={() => setSelectedStaffForProfile(sub)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-main)', cursor: 'pointer', padding: '0.3rem 0.4rem', background: '#FFFFFF', borderRadius: '4px', border: '1px solid #F3F4F6' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--primary-brown)' }}>&bull; {sub.name}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({sub.role?.replace(/_/g, ' ')})</span>
                        </div>
                        <ChevronRight size={13} color="var(--text-muted)" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.3rem 0' }}>
                    Nenhum liderado direto atribuído no momento.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lojas sob Gestão (para consultor) */}
          {role === 'CONSULTOR' && (
            <div style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Store size={18} color="var(--primary-brown)" /> Carteira de Lojas Exclusiva ({assignedStoreList.length})
                </h4>
              </div>

              {assignedStoreList.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Nenhuma loja atribuída a este consultor no momento.
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.65rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                  {assignedStoreList.map(st => (
                    <div 
                      key={st.id}
                      style={{
                        padding: '0.55rem 0.75rem',
                        background: '#FAF8F5',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {st.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Código RP: <strong>{st.code}</strong> &bull; {st.city}/{st.state}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Últimas Visitas Realizadas */}
          <div style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <Calendar size={18} color="var(--primary-brown)" /> Histórico Recente de Visitas ({staffVisits.length})
            </h4>

            {staffVisits.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Nenhuma visita de consultoria registrada para este profissional.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {staffVisits.slice(0, 3).map(v => {
                  const st = stores.find(s => s.id === v.storeId);
                  return (
                    <div 
                      key={v.id}
                      onClick={() => {
                        setSelectedStaffForProfile(null);
                        setSelectedVisitForReport(v);
                      }}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        background: '#FAF8F5',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.86rem', color: 'var(--primary-brown)' }}>
                          {st?.name || 'Unidade Spoleto'}
                        </strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Data: {new Date(v.date + 'T12:00:00').toLocaleDateString('pt-BR')} &bull; {v.visitType}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge badge-media" style={{ fontSize: '0.72rem' }}>
                          {v.diagnostics?.length || 0} apontamentos
                        </span>
                        <ChevronRight size={15} color="var(--text-muted)" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            {staff.email && (
              <a 
                href={`mailto:${staff.email}`}
                className="btn-secondary"
                style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', textDecoration: 'none' }}
              >
                <Mail size={14} /> Enviar E-mail
              </a>
            )}

            {staff.phone && (
              <a 
                href={`https://wa.me/55${cleanPhone}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', textDecoration: 'none' }}
              >
                <MessageSquare size={14} /> WhatsApp
              </a>
            )}

            <button 
              className="btn-primary" 
              onClick={() => setSelectedStaffForProfile(null)}
              style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
            >
              Fechar Ficha
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
