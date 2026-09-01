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

// Format Brazilian Phone Number with mask: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
export function formatPhoneNumber(phone) {
  if (!phone) return '';
  const cleaned = ('' + phone).replace(/\D/g, '');
  if (!cleaned) return '';
  
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 9) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  } else if (cleaned.length === 8) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  } else if (cleaned.length > 2) {
    if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    } else if (cleaned.length <= 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    } else {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
    }
  }
  return phone;
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
