import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Award, 
  Trophy, 
  Medal, 
  Star, 
  Store, 
  User, 
  MapPin, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  ShieldAlert, 
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { evaluateActionPlanStatus } from '../utils/dateHelpers';

export default function StoreRankingView() {
  const { stores, visits, consultants, setSelectedStoreForProfile } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStateFilter, setSelectedStateFilter] = useState('Todos');
  const [rankingTab, setRankingTab] = useState('top'); // 'top' | 'attention' | 'all'

  // Calcular pontuação de excelência de cada loja (0 a 100)
  const rankedStores = stores.map(store => {
    const storeVisits = visits.filter(v => v.storeId === store.id);
    const consultant = consultants.find(c => c.id === store.consultantId);

    let totalPlans = 0;
    let completedPlans = 0;
    let overduePlans = 0;
    const seenProblems = new Set();
    let reoccurrences = 0;

    storeVisits.forEach(v => {
      (v.diagnostics || []).forEach(d => {
        totalPlans++;
        const status = d.actionPlan?.status || 'NÃO INICIADO';
        const deadline = d.actionPlan?.deadline || 'IMEDIATO';
        const metrics = evaluateActionPlanStatus(v.date, deadline, status);

        if (metrics.isCompleted) completedPlans++;
        if (metrics.isOverdue) overduePlans++;

        const key = `${d.categoryId}-${d.subproblemId}`;
        if (seenProblems.has(key)) {
          reoccurrences++;
        } else {
          seenProblems.add(key);
        }
      });
    });

    // Score de Excelência Spoleto (0 a 100)
    let score = 90; // Pontuação base
    if (storeVisits.length > 0) score += 5; // Bônus por auditoria realizada
    if (totalPlans > 0) {
      const resolutionRate = completedPlans / totalPlans;
      score += Math.round(resolutionRate * 10);
      score -= overduePlans * 8; // Penalidade por atraso
      score -= reoccurrences * 5; // Penalidade por reincidência
    }
    score = Math.max(Math.min(score, 100), 30); // Limita entre 30 e 100

    // Categoria de Selo
    let badgeLabel = 'Franquia Prata';
    let badgeColor = '#2563EB';
    let badgeBg = '#EFF6FF';

    if (score >= 95 && overduePlans === 0) {
      badgeLabel = '👑 Franquia Diamante';
      badgeColor = '#7C3AED';
      badgeBg = '#F5F3FF';
    } else if (score >= 85) {
      badgeLabel = '⭐ Franquia Ouro';
      badgeColor = '#D97706';
      badgeBg = '#FEF3C7';
    } else if (score < 65 || overduePlans >= 3) {
      badgeLabel = '⚠️ Zona de Atenção';
      badgeColor = '#DC2626';
      badgeBg = '#FEF2F2';
    }

    return {
      store,
      consultant,
      score,
      badgeLabel,
      badgeColor,
      badgeBg,
      totalVisits: storeVisits.length,
      totalPlans,
      completedPlans,
      overduePlans,
      reoccurrences
    };
  });

  // Ordenar por maior pontuação (ranking decrescente)
  rankedStores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.overduePlans - b.overduePlans;
  });

  // Filtragem
  const filteredRankedStores = rankedStores.filter(item => {
    const q = searchTerm.toLowerCase().trim();
    if (q) {
      const matches = 
        item.store.name.toLowerCase().includes(q) ||
        item.store.code.toLowerCase().includes(q) ||
        item.store.city.toLowerCase().includes(q) ||
        (item.store.franchisee || '').toLowerCase().includes(q) ||
        (item.consultant?.name || '').toLowerCase().includes(q);
      if (!matches) return false;
    }

    if (selectedStateFilter !== 'Todos' && item.store.state !== selectedStateFilter) {
      return false;
    }

    if (rankingTab === 'top') return item.score >= 80;
    if (rankingTab === 'attention') return item.score < 70 || item.overduePlans > 0;
    return true;
  });

  // Se houver termo na busca ou filtro por UF, exibe todos os resultados correspondentes.
  // Caso contrário, exibe estritamente o TOP 5 para manter o layout limpo.
  const isSearchingOrFiltering = searchTerm.trim().length > 0 || selectedStateFilter !== 'Todos';
  const displayedRankedStores = isSearchingOrFiltering ? filteredRankedStores : filteredRankedStores.slice(0, 5);

  const top3 = rankedStores.slice(0, 3);
  const states = ['Todos', ...Array.from(new Set(stores.map(s => s.state))).sort()];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header do Ranking */}
      <div style={{
        background: 'linear-gradient(135deg, #78350F 0%, #B45309 50%, #5D3826 100%)',
        padding: '1.5rem 1.75rem',
        borderRadius: 'var(--radius-lg)',
        color: '#FFFFFF',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Trophy size={24} color="#FDE68A" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', color: '#FFFFFF', margin: 0, fontWeight: 800 }}>
              Ranking de Excelência & Gamificação da Rede
            </h2>
            <p style={{ color: '#FEE2E2', fontSize: '0.82rem', margin: '0.2rem 0 0' }}>
              Reconhecimento positivo das unidades com maior conformidade, pontualidade no SLA e zero reincidências.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.25)', padding: '0.35rem', borderRadius: 'var(--radius-md)' }}>
          <button
            type="button"
            onClick={() => setRankingTab('top')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: rankingTab === 'top' ? '#FFFFFF' : 'transparent',
              color: rankingTab === 'top' ? '#5D3826' : '#FFFFFF',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            🏆 Top Destaques (Nota 10)
          </button>
          <button
            type="button"
            onClick={() => setRankingTab('attention')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: rankingTab === 'attention' ? '#FFFFFF' : 'transparent',
              color: rankingTab === 'attention' ? '#5D3826' : '#FFFFFF',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            🎯 Foco Pedagógico & Apoio
          </button>
          <button
            type="button"
            onClick={() => setRankingTab('all')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: rankingTab === 'all' ? '#FFFFFF' : 'transparent',
              color: rankingTab === 'all' ? '#5D3826' : '#FFFFFF',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Todas as Lojas ({stores.length})
          </button>
        </div>
      </div>

      {/* Pódio TOP 3 Lojas Spoleto */}
      {top3.length >= 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', alignItems: 'flex-end' }}>
          
          {/* 2º Lugar - Prata */}
          <div 
            onClick={() => setSelectedStoreForProfile(top3[1].store)}
            style={{
              background: '#FFFFFF',
              border: '2px solid #94A3B8',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              transition: 'transform 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🥈</div>
            <span style={{ fontSize: '0.72rem', background: '#F1F5F9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontWeight: 800 }}>
              2º LUGAR BRASIL
            </span>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--primary-brown)', margin: '0.5rem 0 0.2rem 0', fontWeight: 800 }}>
              {top3[1].store.name}
            </h3>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              {top3[1].store.city}/{top3[1].store.state} &bull; RP: {top3[1].store.code}
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#475569', margin: '0.6rem 0' }}>
              {top3[1].score} pts
            </div>
            <span style={{ fontSize: '0.72rem', background: top3[1].badgeBg, color: top3[1].badgeColor, padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)', fontWeight: 800 }}>
              {top3[1].badgeLabel}
            </span>
          </div>

          {/* 1º Lugar - Ouro (Destaque Central Mais Alto) */}
          <div 
            onClick={() => setSelectedStoreForProfile(top3[0].store)}
            style={{
              background: 'linear-gradient(180deg, #FEFCE8 0%, #FFFFFF 100%)',
              border: '3px solid #EAB308',
              borderRadius: 'var(--radius-lg)',
              padding: '1.75rem 1.25rem',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(234,179,8,0.25)',
              cursor: 'pointer',
              transform: 'scale(1.03)',
              transition: 'transform 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05) translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.03) translateY(0)'}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>🥇</div>
            <span style={{ fontSize: '0.75rem', background: '#FEF08A', color: '#854D0E', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontWeight: 800 }}>
              👑 CAMPEÃ NACIONAL DE EXCELÊNCIA
            </span>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--primary-brown)', margin: '0.6rem 0 0.2rem 0', fontWeight: 800 }}>
              {top3[0].store.name}
            </h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {top3[0].store.city}/{top3[0].store.state} &bull; RP: {top3[0].store.code}
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#B45309', margin: '0.6rem 0' }}>
              {top3[0].score} pts
            </div>
            <span style={{ fontSize: '0.75rem', background: top3[0].badgeBg, color: top3[0].badgeColor, padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', fontWeight: 800 }}>
              {top3[0].badgeLabel}
            </span>
          </div>

          {/* 3º Lugar - Bronze */}
          <div 
            onClick={() => setSelectedStoreForProfile(top3[2].store)}
            style={{
              background: '#FFFFFF',
              border: '2px solid #D97706',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              transition: 'transform 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🥉</div>
            <span style={{ fontSize: '0.72rem', background: '#FEF3C7', color: '#92400E', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontWeight: 800 }}>
              3º LUGAR BRASIL
            </span>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--primary-brown)', margin: '0.5rem 0 0.2rem 0', fontWeight: 800 }}>
              {top3[2].store.name}
            </h3>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              {top3[2].store.city}/{top3[2].store.state} &bull; RP: {top3[2].store.code}
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#92400E', margin: '0.6rem 0' }}>
              {top3[2].score} pts
            </div>
            <span style={{ fontSize: '0.72rem', background: top3[2].badgeBg, color: top3[2].badgeColor, padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)', fontWeight: 800 }}>
              {top3[2].badgeLabel}
            </span>
          </div>

        </div>
      )}

      {/* Tabela Completa do Ranking */}
      <div className="card-panel" style={{ margin: 0 }}>
        
        {/* Barra de Filtros */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder="Buscar unidade, código RP, cidade ou consultor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.4rem', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Estado (UF):</label>
            <select
              value={selectedStateFilter}
              onChange={(e) => setSelectedStateFilter(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
            >
              {states.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabela do Ranking */}
        <div className="spoleto-table-container">
          <table className="spoleto-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'center', width: '60px' }}>Posição</th>
                <th>Unidade & Código RP</th>
                <th>Franqueado(a) & Consultor(a)</th>
                <th style={{ textAlign: 'center' }}>Score de Excelência</th>
                <th style={{ textAlign: 'center' }}>Visitas</th>
                <th style={{ textAlign: 'center' }}>Planos Concluídos</th>
                <th style={{ textAlign: 'center' }}>Atrasos</th>
                <th>Classificação de Honra</th>
                <th style={{ textAlign: 'center' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {displayedRankedStores.map((item, index) => (
                <tr key={item.store.id}>
                  <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.92rem', color: index === 0 ? '#B45309' : index === 1 ? '#475569' : index === 2 ? '#92400E' : 'var(--text-muted)' }}>
                    {index === 0 ? '🥇 1º' : index === 1 ? '🥈 2º' : index === 2 ? '🥉 3º' : `${index + 1}º`}
                  </td>
                  <td>
                    <strong 
                      onClick={() => setSelectedStoreForProfile(item.store)}
                      style={{ color: 'var(--primary-brown)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.88rem' }}
                      title="Abrir Ficha 360° da Loja"
                    >
                      {item.store.name}
                    </strong>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      RP: <strong>{item.store.code}</strong> &bull; {item.store.city}/{item.store.state}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {item.store.franchisee || 'Franqueado Oficial'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      👨‍💼 {item.consultant?.name || 'Não atribuído'}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: item.score >= 85 ? '#166534' : item.score >= 70 ? '#B45309' : '#991B1B' }}>
                      {item.score}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}> / 100</span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.totalVisits}</td>
                  <td style={{ textAlign: 'center', color: '#166534', fontWeight: 700 }}>{item.completedPlans}</td>
                  <td style={{ textAlign: 'center', color: item.overduePlans > 0 ? '#991B1B' : '#166534', fontWeight: 700 }}>{item.overduePlans}</td>
                  <td>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)', background: item.badgeBg, color: item.badgeColor }}>
                      {item.badgeLabel}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', gap: '0.25rem' }}
                      onClick={() => setSelectedStoreForProfile(item.store)}
                    >
                      <ExternalLink size={12} /> Ficha 360°
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rodapé explicativo do TOP 5 */}
        {!isSearchingOrFiltering && (
          <div style={{ padding: '0.85rem 1rem', background: '#FAF8F5', borderTop: '1px solid var(--border-subtle)', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
            <Sparkles size={14} color="var(--accent-gold)" />
            <span>Exibindo os <strong>5 primeiros colocados</strong> do Brasil. Digite o nome ou código de qualquer unidade na barra de pesquisa para consultar sua posição no ranking!</span>
          </div>
        )}
      </div>

    </div>
  );
}
