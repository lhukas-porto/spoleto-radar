import React from 'react';
import { SPOLETO_LOGO_DARK } from './spoletoLogoAssets';
import { 
  BarChart2, 
  Store, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Award,
  Layers,
  Target
} from 'lucide-react';

export default function ExecutiveNetworkPdfReport({
  reportRef,
  activePeriodLabel,
  selectedTopicFilter,
  selectedStateFilter,
  selectedSeverityFilter,
  viewMode,
  focusedSubtopicData,
  stores = [],
  totalUniqueStoresWithIssues = 0,
  totalIssuesCount = 0,
  topNetworkProblems = [],
  displayedTopics = []
}) {
  const totalStoresCount = stores.length;
  const networkCoveragePct = totalStoresCount > 0 
    ? ((totalUniqueStoresWithIssues / totalStoresCount) * 100).toFixed(1) 
    : '0';

  // Cálculos de severidade
  let critCount = 0;
  let highCount = 0;
  let medCount = 0;
  let lowCount = 0;

  displayedTopics.forEach(t => {
    (t.subtopics || []).forEach(st => {
      critCount += st.severityCount?.Crítica || 0;
      highCount += st.severityCount?.Alta || 0;
      medCount += st.severityCount?.Média || 0;
      lowCount += st.severityCount?.Baixa || 0;
    });
  });

  const highImpactCount = critCount + highCount;
  const highImpactPct = totalIssuesCount > 0 
    ? Math.round((highImpactCount / totalIssuesCount) * 100) 
    : 0;

  const issueDateStr = new Date().toLocaleDateString('pt-BR');
  const issueTimeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div 
      id="executive-report-document"
      ref={reportRef}
      style={{
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '2.5rem 3rem',
        maxWidth: '900px',
        margin: '0 auto',
        boxSizing: 'border-box',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
      }}
    >
      {/* =========================================================================
          CABEÇALHO CORPORATIVO
          ========================================================================= */}
      <div style={{ borderBottom: '3px solid #D97706', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <img 
              src={SPOLETO_LOGO_DARK} 
              alt="Spoleto" 
              style={{ height: '34px', objectFit: 'contain', marginBottom: '0.5rem' }} 
            />
            <h1 style={{ 
              fontSize: '1.35rem', 
              fontWeight: 900, 
              color: '#3E2415', 
              margin: 0, 
              letterSpacing: '-0.02em',
              textTransform: 'uppercase'
            }}>
              SPOLETO RADAR &bull; RELATÓRIO EXECUTIVO DA REDE
            </h1>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
              {viewMode === 'FOCUS' && focusedSubtopicData
                ? `Laudo Cirúrgico Focal: "${focusedSubtopicData.subTitle}"`
                : 'Diagnóstico Estratégico Consolidado de Não-Conformidades e Ocorrências'}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{
              display: 'inline-block',
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              border: '1px solid #FDE68A',
              padding: '0.25rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.68rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              DOCUMENTO DE GOVERNANÇA &bull; DIRETORIA
            </span>
            <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.4rem', fontWeight: 600 }}>
              Emissão: <strong>{issueDateStr}</strong> às {issueTimeStr}
            </div>
          </div>
        </div>

        {/* Quadro de Metadados / Parâmetros do Filtro */}
        <div style={{
          marginTop: '1.15rem',
          backgroundColor: '#FAF8F5',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          fontSize: '0.76rem'
        }}>
          <div>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>
              Período Analisado:
            </span>
            <strong style={{ color: '#3E2415', fontSize: '0.82rem' }}>{activePeriodLabel}</strong>
          </div>

          <div>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>
              Tema / Disciplina:
            </span>
            <strong style={{ color: '#3E2415', fontSize: '0.82rem' }}>
              {selectedTopicFilter === 'Todos' ? 'Todas as Disciplinas' : selectedTopicFilter}
            </strong>
          </div>

          <div>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>
              Recorte Regional (UF):
            </span>
            <strong style={{ color: '#3E2415', fontSize: '0.82rem' }}>
              {selectedStateFilter === 'Todos' ? 'Todas as Unidades (Nacional)' : selectedStateFilter}
            </strong>
          </div>

          <div>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>
              Filtro de Severidade:
            </span>
            <strong style={{ color: '#3E2415', fontSize: '0.82rem' }}>
              {selectedSeverityFilter === 'Todos' ? 'Todas as Gravidades' : selectedSeverityFilter}
            </strong>
          </div>
        </div>
      </div>

      {/* =========================================================================
          QUADRO SINTÉTICO DE INDICADORES (KPIS GLOBAIS)
          ========================================================================= */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h3 style={{
          fontSize: '0.86rem',
          fontWeight: 800,
          color: '#3E2415',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          margin: '0 0 0.75rem 0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <BarChart2 size={16} color="#D97706" /> Indicadores Globais do Período
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.75rem'
        }}>
          {/* KPI 1: Universo Total */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '0.75rem 0.85rem'
          }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Universo da Rede
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', marginTop: '0.2rem' }}>
              {totalStoresCount}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.15rem' }}>
              Lojas cadastradas
            </div>
          </div>

          {/* KPI 2: Lojas com Apontamentos */}
          <div style={{
            backgroundColor: '#FEF3C7',
            border: '1px solid #FDE68A',
            borderRadius: '8px',
            padding: '0.75rem 0.85rem'
          }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase' }}>
              Lojas Afetadas
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#92400E', marginTop: '0.2rem' }}>
              {totalUniqueStoresWithIssues} <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>({networkCoveragePct}%)</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#B45309', marginTop: '0.15rem' }}>
              Com não-conformidades
            </div>
          </div>

          {/* KPI 3: Total Ocorrências */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '0.75rem 0.85rem'
          }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Não-Conformidades
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', marginTop: '0.2rem' }}>
              {totalIssuesCount}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.15rem' }}>
              Laudos em campo
            </div>
          </div>

          {/* KPI 4: Severidade Crítica / Alta */}
          <div style={{
            backgroundColor: highImpactPct > 40 ? '#FEF2F2' : '#F8FAFC',
            border: highImpactPct > 40 ? '1px solid #FECACA' : '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '0.75rem 0.85rem'
          }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: highImpactPct > 40 ? '#991B1B' : '#475569', textTransform: 'uppercase' }}>
              Severidade Alta/Crítica
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: highImpactPct > 40 ? '#DC2626' : '#0F172A', marginTop: '0.2rem' }}>
              {highImpactCount} <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>({highImpactPct}%)</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: highImpactPct > 40 ? '#991B1B' : '#64748B', marginTop: '0.15rem' }}>
              Exigem ação prioritária
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODO CIRÚRGICO (SE O USUÁRIO ESTIVER ANALISANDO UM PROBLEMA ESPECÍFICO)
          ========================================================================= */}
      {viewMode === 'FOCUS' && focusedSubtopicData ? (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            backgroundColor: '#FAF5EE',
            border: '1.5px solid #F59E0B',
            borderRadius: '8px',
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#B45309', textTransform: 'uppercase' }}>
                {focusedSubtopicData.topicName} &bull; RAIO-X CIRÚRGICO
              </span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: focusedSubtopicData.priorityLabel === 'Crítica' ? '#FEE2E2' : '#FEF3C7',
                color: focusedSubtopicData.priorityLabel === 'Crítica' ? '#991B1B' : '#92400E'
              }}>
                PRIORIDADE {focusedSubtopicData.priorityLabel.toUpperCase()}
              </span>
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#3E2415', margin: '0 0 0.4rem 0' }}>
              {focusedSubtopicData.subTitle}
            </h2>
            <div style={{ fontSize: '0.78rem', color: '#475569' }}>
              Identificado em <strong>{focusedSubtopicData.uniqueStoreIds.size} restaurantes</strong> ({totalStoresCount > 0 ? ((focusedSubtopicData.uniqueStoreIds.size / totalStoresCount) * 100).toFixed(1) : 0}% da rede), acumulando <strong>{focusedSubtopicData.occurrencesCount} apontamentos</strong>.
            </div>
          </div>

          <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#3E2415', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
            Lista de Lojas Afetadas e Planos de Ação Registrados:
          </h4>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1.5px solid #CBD5E1', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem 0.65rem', fontWeight: 800, color: '#334155' }}>CÓDIGO / LOJA</th>
                <th style={{ padding: '0.5rem 0.65rem', fontWeight: 800, color: '#334155' }}>UF</th>
                <th style={{ padding: '0.5rem 0.65rem', fontWeight: 800, color: '#334155' }}>FRANQUEADO</th>
                <th style={{ padding: '0.5rem 0.65rem', fontWeight: 800, color: '#334155' }}>GRAVIDADE</th>
                <th style={{ padding: '0.5rem 0.65rem', fontWeight: 800, color: '#334155' }}>AÇÃO CORRETIVA REGISTRADA</th>
              </tr>
            </thead>
            <tbody>
              {focusedSubtopicData.storesList.map((st, idx) => (
                <tr 
                  key={st.storeId + '-' + idx} 
                  style={{ 
                    borderBottom: '1px solid #E2E8F0',
                    backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'
                  }}
                >
                  <td style={{ padding: '0.5rem 0.65rem', fontWeight: 700, color: '#0F172A' }}>
                    <span style={{ color: '#B45309', marginRight: '0.35rem' }}>{st.storeCode}</span>
                    {st.storeName.replace('SPOLETO', '').trim()}
                  </td>
                  <td style={{ padding: '0.5rem 0.65rem', color: '#475569' }}>{st.state}</td>
                  <td style={{ padding: '0.5rem 0.65rem', color: '#334155' }}>{st.franchisee}</td>
                  <td style={{ padding: '0.5rem 0.65rem' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      backgroundColor: st.severity === 'Crítica' ? '#FEE2E2' : (st.severity === 'Alta' ? '#FFEDD5' : '#F1F5F9'),
                      color: st.severity === 'Crítica' ? '#991B1B' : (st.severity === 'Alta' ? '#C2410C' : '#475569')
                    }}>
                      {st.severity}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem 0.65rem', color: '#1E293B' }}>
                    {st.actionPlan?.action ? (
                      <div>
                        <strong>{st.actionPlan.action}</strong>
                        {st.actionPlan.deadline && (
                          <span style={{ color: '#64748B', display: 'block', fontSize: '0.68rem' }}>
                            Prazo: {st.actionPlan.deadline} &bull; Resp: {st.actionPlan.responsible || 'Gerente'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Sem ação registrada</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* =========================================================================
            MODO GERAL: RANKING DE MAIORES GARGALOS + MATRIZ POR DISCIPLINA
            ========================================================================= */
        <>
          {/* SEÇÃO 1: TOP GARGALOS MAIS FREQUENTES */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={{
              fontSize: '0.86rem',
              fontWeight: 800,
              color: '#3E2415',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              margin: '0 0 0.65rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <Award size={16} color="#D97706" /> Top Gargalos Mais Recorrentes da Rede
            </h3>

            {topNetworkProblems.length === 0 ? (
              <div style={{ padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: '6px', fontSize: '0.78rem', color: '#64748B', textAlign: 'center' }}>
                Nenhum gargalo identificado nos filtros aplicados.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1.5px solid #CBD5E1', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem 0.65rem', width: '32px', fontWeight: 800, color: '#334155' }}>#</th>
                    <th style={{ padding: '0.5rem 0.65rem', fontWeight: 800, color: '#334155' }}>DISCIPLINA / TEMA</th>
                    <th style={{ padding: '0.5rem 0.65rem', fontWeight: 800, color: '#334155' }}>NÃO-CONFORMIDADE / PROBLEMA</th>
                    <th style={{ padding: '0.5rem 0.65rem', fontWeight: 800, color: '#334155' }}>GRAVIDADE</th>
                    <th style={{ padding: '0.5rem 0.65rem', textAlign: 'center', fontWeight: 800, color: '#334155' }}>LOJAS</th>
                    <th style={{ padding: '0.5rem 0.65rem', textAlign: 'center', fontWeight: 800, color: '#334155' }}>% REDE</th>
                    <th style={{ padding: '0.5rem 0.65rem', textAlign: 'center', fontWeight: 800, color: '#334155' }}>LAUDOS</th>
                  </tr>
                </thead>
                <tbody>
                  {topNetworkProblems.map((prob, idx) => {
                    const probPct = totalStoresCount > 0 
                      ? ((prob.uniqueStoreIds.size / totalStoresCount) * 100).toFixed(1) 
                      : '0';

                    return (
                      <tr 
                        key={prob.subKey || idx} 
                        style={{ 
                          borderBottom: '1px solid #E2E8F0',
                          backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'
                        }}
                      >
                        <td style={{ padding: '0.5rem 0.65rem', fontWeight: 900, color: '#B45309' }}>
                          {idx + 1}º
                        </td>
                        <td style={{ padding: '0.5rem 0.65rem', color: '#475569', fontWeight: 600, fontSize: '0.72rem' }}>
                          {prob.topicName}
                        </td>
                        <td style={{ padding: '0.5rem 0.65rem', fontWeight: 700, color: '#0F172A' }}>
                          {prob.subTitle}
                        </td>
                        <td style={{ padding: '0.5rem 0.65rem' }}>
                          <span style={{
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            backgroundColor: prob.priorityLabel === 'Crítica' ? '#FEE2E2' : (prob.priorityLabel === 'Alta' ? '#FFEDD5' : '#F1F5F9'),
                            color: prob.priorityLabel === 'Crítica' ? '#991B1B' : (prob.priorityLabel === 'Alta' ? '#C2410C' : '#475569')
                          }}>
                            {prob.priorityLabel}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem 0.65rem', textAlign: 'center', fontWeight: 800, color: '#0F172A' }}>
                          {prob.uniqueStoreIds.size}
                        </td>
                        <td style={{ padding: '0.5rem 0.65rem', textAlign: 'center', fontWeight: 700, color: '#64748B' }}>
                          {probPct}%
                        </td>
                        <td style={{ padding: '0.5rem 0.65rem', textAlign: 'center', fontWeight: 800, color: '#B45309' }}>
                          {prob.occurrencesCount}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* SEÇÃO 2: QUADRO SINTÉTICO POR DISCIPLINA */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={{
              fontSize: '0.86rem',
              fontWeight: 800,
              color: '#3E2415',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              margin: '0 0 0.75rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <Layers size={16} color="#D97706" /> Quadro Consolidado por Disciplina
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {displayedTopics.map(topic => {
                if (!topic.subtopics || topic.subtopics.length === 0) return null;

                return (
                  <div 
                    key={topic.id}
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Barra de Título da Disciplina */}
                    <div style={{
                      backgroundColor: '#FAF8F5',
                      borderBottom: '1px solid #E2E8F0',
                      padding: '0.5rem 0.85rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: topic.color || '#5D3826' }} />
                        <strong style={{ fontSize: '0.8rem', color: '#3E2415', textTransform: 'uppercase' }}>
                          {topic.name}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>
                        <span>Lojas: <strong style={{ color: '#0F172A' }}>{topic.uniqueStoresCount}</strong></span>
                        <span>Ocorrências: <strong style={{ color: '#B45309' }}>{topic.occurrencesCount}</strong></span>
                      </div>
                    </div>

                    {/* Tabela dos Subtópicos da Disciplina */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
                      <tbody>
                        {topic.subtopics.map((st, sIdx) => {
                          // Lojas resumidas (máximo 6 para manter sucinto)
                          const previewStores = st.storesList.slice(0, 5).map(s => `${s.storeCode} (${s.state})`).join(', ');
                          const extraStoresCount = st.storesList.length > 5 ? ` +${st.storesList.length - 5} lojas` : '';

                          return (
                            <tr 
                              key={st.subKey || sIdx}
                              style={{ 
                                borderBottom: sIdx === topic.subtopics.length - 1 ? 'none' : '1px solid #F1F5F9',
                                backgroundColor: sIdx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'
                              }}
                            >
                              <td style={{ padding: '0.45rem 0.85rem', width: '38%', fontWeight: 700, color: '#1E293B' }}>
                                {st.subTitle}
                              </td>

                              <td style={{ padding: '0.45rem 0.65rem', width: '12%' }}>
                                <span style={{
                                  fontSize: '0.64rem',
                                  fontWeight: 700,
                                  padding: '0.1rem 0.35rem',
                                  borderRadius: '3px',
                                  backgroundColor: st.priorityLabel === 'Crítica' ? '#FEE2E2' : (st.priorityLabel === 'Alta' ? '#FFEDD5' : '#F1F5F9'),
                                  color: st.priorityLabel === 'Crítica' ? '#991B1B' : (st.priorityLabel === 'Alta' ? '#C2410C' : '#475569')
                                }}>
                                  {st.priorityLabel}
                                </span>
                              </td>

                              <td style={{ padding: '0.45rem 0.65rem', width: '15%', fontWeight: 700, color: '#64748B' }}>
                                <strong>{st.uniqueStoreIds.size}</strong> {st.uniqueStoreIds.size === 1 ? 'loja' : 'lojas'} ({st.occurrencesCount} laudos)
                              </td>

                              <td style={{ padding: '0.45rem 0.85rem', width: '35%', color: '#64748B', fontSize: '0.7rem' }}>
                                <span style={{ color: '#334155' }}>{previewStores}{extraStoresCount}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          RODAPÉ CORPORATIVO & CAMPO DE HOMOLOGAÇÃO
          ========================================================================= */}
      <div style={{
        marginTop: '2.5rem',
        paddingTop: '1.25rem',
        borderTop: '1px solid #CBD5E1',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        fontSize: '0.72rem',
        color: '#64748B'
      }}>
        <div>
          <div style={{ fontWeight: 800, color: '#3E2415', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
            SPOLETO RADAR &bull; GRUPO TRIGO
          </div>
          <div>Sistema Integrado de Governança e Inteligência Operacional de Franquias.</div>
          <div>Documento confidencial gerado para lideranças executivas e consultores de campo.</div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ width: '180px', borderBottom: '1px solid #94A3B8', marginBottom: '0.35rem' }} />
          <div style={{ fontWeight: 700, color: '#334155' }}>Diretoria de Operações</div>
          <div>Grupo Trigo / Franquias Spoleto</div>
        </div>
      </div>
    </div>
  );
}
