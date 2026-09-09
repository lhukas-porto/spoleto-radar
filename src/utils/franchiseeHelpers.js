/**
 * Utilitários para Inteligência e Agrupamento de Franqueados Spoleto
 * Método S.H.A.R.K. - Inteligência de Negócios & Rede Franqueada
 */

/**
 * Agrupa sócios que compartilham a mesma loja ou conjunto de lojas em 1 único "Grupo Franqueado / Operador".
 * Exemplo: Se a loja Orion possui 2 sócios cadastrados, eles formam 1 único Grupo Franqueado na contagem oficial da rede.
 * 
 * @param {Array} franchisees - Lista de franqueados cadastrados
 * @returns {Array} Lista de grupos franqueados consolidados
 */
export function getFranchiseeGroups(franchisees = []) {
  if (!franchisees || franchisees.length === 0) return [];

  // Union-Find (Disjoint Set) para conectar franqueados que compartilham lojas
  const parent = {};
  franchisees.forEach(f => {
    parent[f.id] = f.id;
  });

  const find = (i) => {
    if (parent[i] === i) return i;
    parent[i] = find(parent[i]);
    return parent[i];
  };

  const union = (i, j) => {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      parent[rootI] = rootJ;
    }
  };

  // Mapeia storeId -> lista de IDs de franqueados vinculados a ela
  const storeToFrans = {};
  franchisees.forEach(f => {
    const stores = f.assignedStoreIds || [];
    stores.forEach(sId => {
      if (!storeToFrans[sId]) storeToFrans[sId] = [];
      storeToFrans[sId].push(f.id);
    });
  });

  // Une os franqueados que compartilham qualquer loja em comum
  Object.values(storeToFrans).forEach(franIds => {
    if (franIds.length > 1) {
      for (let k = 1; k < franIds.length; k++) {
        union(franIds[0], franIds[k]);
      }
    }
  });

  // Agrupa os franqueados por raiz (cluster/grupo operacional)
  const groupsMap = {};
  franchisees.forEach(f => {
    const root = find(f.id);
    if (!groupsMap[root]) {
      groupsMap[root] = {
        id: root,
        partners: [],
        storeIds: new Set()
      };
    }
    groupsMap[root].partners.push(f);
    (f.assignedStoreIds || []).forEach(sId => groupsMap[root].storeIds.add(sId));
  });

  return Object.values(groupsMap).map(g => ({
    id: g.id,
    partners: g.partners,
    partnerCount: g.partners.length,
    storeIds: Array.from(g.storeIds),
    storeCount: g.storeIds.size,
    isMultiUnit: g.storeIds.size > 1,
    // Nome do grupo: se tiver mais de um sócio, identifica a sociedade
    groupName: g.partners.length === 1 
      ? g.partners[0].name 
      : g.partners.map(p => p.name).join(' & ')
  }));
}
