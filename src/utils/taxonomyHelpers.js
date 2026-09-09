/**
 * Utilitários de Ordenação e Classificação da Matriz de Tópicos & Planos de Ação
 */

/**
 * Retorna o peso de importância de uma severidade:
 * 1: Crítica / Urgente
 * 2: Alta
 * 3: Média
 * 4: Baixa / Leve
 */
export const getSeverityRank = (severity) => {
  const s = String(severity || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  if (s === 'critica' || s === 'urgente') return 1;
  if (s === 'alta') return 2;
  if (s === 'media') return 3;
  if (s === 'baixa' || s === 'leve') return 4;
  return 5;
};

/**
 * Ordena subtópicos por grau de importância (Crítica -> Alta -> Média -> Baixa)
 * e, em caso de empate, alfabeticamente pelo título.
 */
export const sortSubproblemsBySeverity = (subproblems = []) => {
  if (!Array.isArray(subproblems)) return [];
  return [...subproblems].sort((a, b) => {
    const rankA = getSeverityRank(a.defaultSeverity || a.severity);
    const rankB = getSeverityRank(b.defaultSeverity || b.severity);
    if (rankA !== rankB) return rankA - rankB;
    return (a.title || '').localeCompare(b.title || '', 'pt-BR');
  });
};

/**
 * Retorna a classe CSS correspondente para a badge de severidade
 */
export const getSeverityBadgeClass = (severity) => {
  const s = String(severity || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  if (s === 'critica' || s === 'urgente') return 'badge-critica';
  if (s === 'alta') return 'badge-alta';
  if (s === 'media') return 'badge-media';
  if (s === 'baixa' || s === 'leve') return 'badge-baixa';
  return 'badge-media';
};
