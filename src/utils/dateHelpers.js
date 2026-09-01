/**
 * Date and Action Plan Overdue Utility Functions for Spoleto Radar
 */

// Format YYYY-MM-DD or ISO string to Brazilian format DD/MM/YYYY
export function formatBrDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('pt-BR');
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
}

// Format Brazilian Phone/Mobile Number with mask: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
export function formatPhoneNumber(phone) {
  if (!phone) return '';
  const digits = ('' + phone).replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  
  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

// Calculate the expected target Due Date of an Action Plan based on visitDate and deadline rule
export function calculateActionPlanDueDate(visitDateStr, deadlineStr) {
  if (!visitDateStr) return new Date();
  
  // Base date from visit
  const cleanVisitDate = visitDateStr.includes('T') ? visitDateStr.split('T')[0] : visitDateStr;
  const visitDate = new Date(cleanVisitDate + 'T12:00:00');
  
  if (!deadlineStr) return visitDate;
  
  const trimmed = deadlineStr.trim();

  // If the deadline is already an ISO / YYYY-MM-DD date string
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(trimmed + 'T12:00:00');
  }

  const lower = trimmed.toLowerCase();
  const targetDate = new Date(visitDate.getTime());

  if (lower.includes('imediat') || lower.includes('24h') || lower.includes('1 dia')) {
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (lower.includes('48h') || lower.includes('2 dia')) {
    targetDate.setDate(targetDate.getDate() + 2);
  } else if (lower.includes('7 dia') || lower.includes('7d') || lower.includes('1 semana')) {
    targetDate.setDate(targetDate.getDate() + 7);
  } else if (lower.includes('15 dia') || lower.includes('15d') || lower.includes('quinzena')) {
    targetDate.setDate(targetDate.getDate() + 15);
  } else if (lower.includes('30 dia') || lower.includes('30d') || lower.includes('1 mês') || lower.includes('próxima visita')) {
    targetDate.setDate(targetDate.getDate() + 30);
  } else {
    // Default fallback: 7 days
    targetDate.setDate(targetDate.getDate() + 7);
  }

  return targetDate;
}

// Evaluate complete action plan status and overdue metrics
export function evaluateActionPlanStatus(visitDateStr, deadlineStr, currentStatus) {
  const isCompleted = currentStatus === 'CONCLUÍDO';
  const dueDate = calculateActionPlanDueDate(visitDateStr, deadlineStr);
  const now = new Date();
  
  // Reset time to start of day for comparison
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const dueDayStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 0, 0, 0);
  
  const diffTime = todayStart.getTime() - dueDayStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // > 0 means overdue by diffDays

  let isOverdue = false;
  let isDueToday = false;
  let isDueThisWeek = false; // Within next 7 days

  if (!isCompleted) {
    if (diffDays > 0) {
      isOverdue = true;
    } else if (diffDays === 0) {
      isDueToday = true;
      isOverdue = true; // Today is limit date
    } else if (diffDays >= -7 && diffDays < 0) {
      isDueThisWeek = true;
    }
  }

  return {
    dueDate,
    formattedDueDate: formatBrDate(dueDate.toISOString().split('T')[0]),
    isCompleted,
    isOverdue,
    isDueToday,
    isDueThisWeek,
    daysOverdue: diffDays > 0 ? diffDays : 0,
    daysRemaining: diffDays < 0 ? Math.abs(diffDays) : 0
  };
}

// Generate Official Spoleto Overdue Email template
export function generateOverdueEmailTemplate({
  storeName,
  storeCode,
  franchiseeName,
  consultantName,
  regionalManagerName,
  overdueItems,
  visitDate
}) {
  const subject = `[SPOLETO ALERTA] Plano de Ação em Atraso - Unidade ${storeName} (Código RP: ${storeCode})`;

  let body = `Prezado(a) Franqueado(a) e Gerência da Unidade ${storeName} [Código RP: ${storeCode}],\n\n`;
  body += `Identificamos que a sua unidade possui Planos de Ação Operacionais com prazo estourado, originados da visita de Consultoria de Negócios realizada em ${formatBrDate(visitDate)}.\n\n`;
  body += `📋 RELAÇÃO DE AÇÕES EM ATRASO:\n`;
  body += `------------------------------------------------------------\n`;

  overdueItems.forEach((item, index) => {
    body += `${index + 1}. [${item.categoryName}] ${item.subproblemTitle}\n`;
    body += `   • Ação Requerida: ${item.action}\n`;
    body += `   • Responsável: ${item.responsible}\n`;
    body += `   • Prazo Definido: ${item.deadline} (Venceu em: ${item.formattedDueDate} - ${item.daysOverdue} dias em atraso)\n`;
    body += `   • Status Atual: ${item.status}\n\n`;
  });

  body += `------------------------------------------------------------\n`;
  body += `Solicitamos a imediata regularização e execução das pendências apontadas acima para manutenção dos padrões de excelência da rede Spoleto.\n\n`;
  body += `Em caso de dúvidas ou necessidade de suporte técnico, favor contatar seu Consultor de Negócios:\n`;
  body += `• Consultor(a): ${consultantName || 'Consultoria de Negócios'}\n`;
  if (regionalManagerName) {
    body += `• Gerente Regional Spoleto: ${regionalManagerName}\n`;
  }
  body += `\nAtenciosamente,\n`;
  body += `Equipe de Consultoria de Negócios Spoleto\n`;
  body += `Grupo Trigo • Spoleto Radar\n`;

  return { subject, body };
}

// Generate WhatsApp Overdue message
export function generateOverdueWhatsAppMessage({
  storeName,
  storeCode,
  consultantName,
  overdueCount,
  overdueItems
}) {
  let msg = `🚨 *SPOLETO RADAR • AVISO DE PLANO DE AÇÃO EM ATRASO* 🚨\n\n`;
  msg += `Olá! Constatamos *${overdueCount} plano(s) de ação pendente(s) e em atraso* para a unidade *${storeName}* [Código RP: ${storeCode}].\n\n`;
  msg += `📋 *Principais Itens a Regularizar:*\n`;

  overdueItems.slice(0, 3).forEach((it, idx) => {
    msg += `• *${it.subproblemTitle}* (Prazo: ${it.formattedDueDate} - ${it.daysOverdue}d de atraso)\n  _Ação:_ ${it.action.slice(0, 70)}...\n\n`;
  });

  if (overdueItems.length > 3) {
    msg += `_... e mais ${overdueItems.length - 3} item(ns)._\n\n`;
  }

  msg += `Favor atualizar o andamento com o(a) Consultor(a) *${consultantName || 'Spoleto'}*.\n`;
  msg += `_Spoleto Radar • Acompanhamento 360°_`;

  return msg;
}

// Calculate the minimum due date (most critical deadline) among all open action plans of a visit
export function getVisitCriticalSla(visit, categories = []) {
  if (!visit || !visit.diagnostics || visit.diagnostics.length === 0) {
    return null;
  }

  const openDiagnostics = visit.diagnostics.filter(d => 
    (d.actionPlan?.status || '').toUpperCase() !== 'CONCLUÍDO'
  );

  if (openDiagnostics.length === 0) {
    return {
      hasOpenPlans: false,
      totalPlans: visit.diagnostics.length,
      completedPlans: visit.diagnostics.length,
      openPlansCount: 0,
      minDueDate: null,
      daysRemaining: 0,
      isDMinusOne: false,
      isDZeroOrOverdue: false,
      openItems: []
    };
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

  const evaluatedItems = openDiagnostics.map(d => {
    const cat = categories.find(c => c.id === d.categoryId);
    const sub = cat?.subproblems?.find(s => s.id === d.subproblemId);
    const deadline = d.actionPlan?.deadline || 'IMEDIATO';
    const dueDate = calculateActionPlanDueDate(visit.date, deadline);
    const dueDayStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 0, 0, 0);
    const diffTime = dueDayStart.getTime() - todayStart.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    return {
      diagnosticId: d.id,
      categoryName: cat?.name ? cat.name.split('(')[0].trim() : 'Geral',
      subproblemTitle: sub?.title || d.subproblemTitle || d.problem || 'Não conformidade',
      action: d.actionPlan?.action || d.actionPlan?.what || 'Executar plano de ação.',
      responsible: d.actionPlan?.responsible || d.actionPlan?.who || 'GERENTE',
      deadline,
      status: d.actionPlan?.status || 'NÃO INICIADO',
      dueDate,
      formattedDueDate: formatBrDate(dueDate.toISOString().split('T')[0]),
      diffDays
    };
  });

  // Sort by smallest dueDate (closest/most critical deadline first)
  evaluatedItems.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const mostCritical = evaluatedItems[0];
  const minDueDate = mostCritical.dueDate;
  const daysRemaining = mostCritical.diffDays;

  // D-1: exatamente 1 dia restante para o prazo terminar (amanhã)
  const isDMinusOne = daysRemaining === 1;
  // D-0 ou atrasado: vence hoje (0 dias) ou já venceu (< 0 dias)
  const isDZeroOrOverdue = daysRemaining <= 0;

  return {
    hasOpenPlans: true,
    totalPlans: visit.diagnostics.length,
    openPlansCount: openDiagnostics.length,
    minDueDate,
    formattedMinDueDate: formatBrDate(minDueDate.toISOString().split('T')[0]),
    daysRemaining,
    isDMinusOne,
    isDZeroOrOverdue,
    daysOverdue: daysRemaining < 0 ? Math.abs(daysRemaining) : 0,
    openItems: evaluatedItems
  };
}

// Generate D-1 Prevention Email Template (24h before smallest deadline)
export function generateDMinusOnePreventionEmail({
  storeName,
  storeCode,
  franchiseeName,
  consultantName,
  regionalManagerName,
  nationalManagerName,
  minDueDateFormatted,
  openItems,
  visitDate
}) {
  const subject = `⚠️ [PREVENÇÃO SPOLETO] Faltam 24h para o prazo do Plano de Ação - Unidade ${storeName} [Código RP: ${storeCode}]`;

  let body = `AVISO PREVENTIVO DE VENCIMENTO DE PLANO DE AÇÃO • GRUPO TRIGO / SPOLETO\n`;
  body += `================================================================================\n\n`;
  body += `Prezado(a) Franqueado(a) e Equipe da Unidade ${storeName} [Código RP: ${storeCode}],\n\n`;
  body += `Este é um comunicado de PREVENÇÃO para informar que o prazo mais curto do Plano de Ação originado da visita de Consultoria em ${formatBrDate(visitDate)} VENCE AMANHÃ (${minDueDateFormatted}).\n\n`;
  body += `📋 RELAÇÃO DE AÇÕES OPERACIONAIS PENDENTES:\n`;
  body += `--------------------------------------------------------------------------------\n`;

  openItems.forEach((it, idx) => {
    body += `${idx + 1}. [${it.categoryName.toUpperCase()}] ${it.subproblemTitle}\n`;
    body += `   • Ação Requerida: ${it.action}\n`;
    body += `   • Responsável: ${it.responsible}\n`;
    body += `   • Prazo Definido: ${it.deadline} (Vencimento: ${it.formattedDueDate})\n`;
    body += `   • Status Atual: ${it.status}\n\n`;
  });

  body += `--------------------------------------------------------------------------------\n`;
  body += `💡 RECOMENDAÇÃO: Solicitamos a verificação e conclusão das pendências antes do encerramento do prazo para que a unidade mantenha 100% de conformidade operacional e evite escalação na rede.\n\n`;
  body += `CADEIA DE ACOMPANHAMENTO SPOLETO:\n`;
  body += `• Franqueado(a): ${franchiseeName || 'Franqueado Oficial'}\n`;
  body += `• Consultor(a) de Negócios: ${consultantName || 'Consultor Spoleto'}\n`;
  if (regionalManagerName) body += `• Gerente Regional: ${regionalManagerName}\n`;
  if (nationalManagerName) body += `• Gerente Nacional: ${nationalManagerName}\n`;
  body += `\nAtenciosamente,\n`;
  body += `Consultoria de Negócios Spoleto • Grupo Trigo\n`;

  return { subject, body };
}

// Generate D-0 Critical Escalation Email Template (On deadline day or overdue)
export function generateDZeroCriticalEscalationEmail({
  storeName,
  storeCode,
  franchiseeName,
  consultantName,
  regionalManagerName,
  nationalManagerName,
  minDueDateFormatted,
  daysOverdue,
  openItems,
  visitDate
}) {
  const isOverdue = daysOverdue > 0;
  const subject = isOverdue
    ? `🚨 [ESCALAÇÃO URGENTE • ATENÇÃO TOTAL] Prazo Esgotado (${daysOverdue}d em atraso) - Unidade ${storeName} [Código RP: ${storeCode}]`
    : `🚨 [ALERTA MÁXIMO • VENCIMENTO HOJE] Atenção Total e Absoluta no Plano de Ação - Unidade ${storeName} [Código RP: ${storeCode}]`;

  let body = `🚨 NOTIFICAÇÃO DE ESCALAÇÃO OPERACIONAL • ATENÇÃO TOTAL E ABSOLUTA 🚨\n`;
  body += `GRUPO TRIGO / SPOLETO — GESTÃO EXECUTIVA DE REDE\n`;
  body += `================================================================================\n\n`;
  body += `ATENÇÃO: Franqueado(a), Consultoria de Negócios, Gerência Regional e Gerência Nacional,\n\n`;
  
  if (isOverdue) {
    body += `Comunicamos que o prazo operacional para resolução das não-conformidades da unidade ${storeName} [Código RP: ${storeCode}] ESTÁ ESGOTADO HÁ ${daysOverdue} DIA(S) (Data limite era: ${minDueDateFormatted}).\n\n`;
  } else {
    body += `Comunicamos que o prazo limite para resolução das não-conformidades da unidade ${storeName} [Código RP: ${storeCode}] EXPIRA HOJE (${minDueDateFormatted}) e ainda constam pendências em aberto.\n\n`;
  }

  body += `Esta notificação foi enviada simultaneamente para toda a cadeia de liderança executiva Spoleto para intervenção e cobrança prioritária.\n\n`;
  body += `📋 PLANOS DE AÇÃO CRÍTICOS EM ABERTO:\n`;
  body += `--------------------------------------------------------------------------------\n`;

  openItems.forEach((it, idx) => {
    body += `${idx + 1}. [${it.categoryName.toUpperCase()}] ${it.subproblemTitle}\n`;
    body += `   • Ação Imediata: ${it.action}\n`;
    body += `   • Responsável: ${it.responsible}\n`;
    body += `   • Prazo: ${it.deadline} (Limite: ${it.formattedDueDate})\n`;
    body += `   • Status: ${it.status} ⚠️\n\n`;
  });

  body += `--------------------------------------------------------------------------------\n`;
  body += `⚠️ DETERMINAÇÃO OPERACIONAL:\n`;
  body += `1. O Franqueado deve providenciar a regularização imediata das pendências.\n`;
  body += `2. O Consultor de Negócios deve validar a correção em loja ou via evidência fotográfica.\n`;
  body += `3. A Gerência Regional e Nacional acompanharão o plano até a baixa total no sistema Spoleto Radar.\n\n`;
  body += `DESTINATÁRIOS NOTIFICADOS (CÓPIA CONSOLIDADA):\n`;
  body += `• Franqueado(a): ${franchiseeName || 'Franqueado Spoleto'}\n`;
  body += `• Consultor(a) de Negócios: ${consultantName || 'Consultor Spoleto'}\n`;
  body += `• Gerente Regional: ${regionalManagerName || 'Gerência Regional'}\n`;
  body += `• Gerente Nacional: ${nationalManagerName || 'LILIANE TAHAN CURY TEIXEIRA DE RESENDE'}\n`;
  body += `\nSpoleto Radar • Monitoramento Contínuo de Padrão & Qualidade\n`;

  return { subject, body };
}
