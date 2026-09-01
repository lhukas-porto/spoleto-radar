import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://axcabkqjojhaxfltebgu.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4Y2Fia3Fqb2poYXhmbHRlYmd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4ODI3OTksImV4cCI6MjEwMzQ1ODc5OX0.FchgXNKoWmzkTnJUR-kzsiR6-DPfNVWrwvOpX_KS5LI';
const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;

// Format YYYY-MM-DD to Brazilian format DD/MM/YYYY
function formatBrDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = cleanDate.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  } catch (e) {
    return dateStr;
  }
}

// Calculate target Due Date of an Action Plan based on visitDate and deadline rule
function calculateDueDate(visitDateStr, deadlineStr) {
  if (!visitDateStr) return new Date();
  const cleanVisitDate = visitDateStr.includes('T') ? visitDateStr.split('T')[0] : visitDateStr;
  const visitDate = new Date(cleanVisitDate + 'T12:00:00');
  if (!deadlineStr) return visitDate;
  
  const trimmed = deadlineStr.trim();
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
    targetDate.setDate(targetDate.getDate() + 7);
  }

  return targetDate;
}

// Calculate the minimum due date (most critical deadline) among all open action plans of a visit
function getVisitCriticalSla(visit, categories = []) {
  if (!visit || !visit.diagnostics || visit.diagnostics.length === 0) return null;

  const openDiagnostics = visit.diagnostics.filter(d => 
    (d.actionPlan?.status || '').toUpperCase() !== 'CONCLUÍDO'
  );

  if (openDiagnostics.length === 0) return null;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

  const evaluatedItems = openDiagnostics.map(d => {
    const cat = categories.find(c => c.id === d.categoryId);
    const sub = cat?.subproblems?.find(s => s.id === d.subproblemId);
    const deadline = d.actionPlan?.deadline || 'IMEDIATO';
    const dueDate = calculateDueDate(visit.date, deadline);
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

  evaluatedItems.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const mostCritical = evaluatedItems[0];
  const minDueDate = mostCritical.dueDate;
  const daysRemaining = mostCritical.diffDays;

  const isDMinusOne = daysRemaining === 1;
  const isDZeroOrOverdue = daysRemaining <= 0;

  return {
    hasOpenPlans: true,
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

// Generate D-1 Prevention Email HTML
function buildD1EmailHtml({ store, consultant, regionalManager, nationalManager, sla, visitDate }) {
  const rows = (sla.openItems || []).map(it => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #EAE3D9;"><strong>[${it.categoryName}]</strong><br>${it.subproblemTitle}</td>
      <td style="padding: 10px; border-bottom: 1px solid #EAE3D9;">${it.action}</td>
      <td style="padding: 10px; border-bottom: 1px solid #EAE3D9;"><strong>${it.formattedDueDate}</strong><br><span style="color:#B45309;font-size:11px;">(Vence Amanhã)</span></td>
      <td style="padding: 10px; border-bottom: 1px solid #EAE3D9;"><span style="background:#FEF3C7;color:#92400E;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:700;">${it.status}</span></td>
    </tr>
  `).join('');

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="font-family:'Segoe UI',Arial,sans-serif;background-color:#FAF8F5;margin:0;padding:20px;color:#2D241E;">
    <div style="max-width:620px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #EAE3D9;box-shadow:0 4px 15px rgba(0,0,0,0.05);">
      <div style="background:linear-gradient(135deg,#78350F 0%,#B45309 100%);padding:24px;color:#FFFFFF;text-align:center;">
        <h1 style="margin:0;font-size:20px;font-weight:800;">SPOLETO RADAR • AVISO PREVENTIVO (D-1)</h1>
        <p style="margin:6px 0 0 0;font-size:13px;opacity:0.9;">Grupo Trigo • Monitoramento 360° de Padrões & Operações</p>
        <div style="background:#FEF3C7;color:#92400E;border:1px solid #F59E0B;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:800;display:inline-block;margin-top:8px;">⏳ FALTAM 24 HORAS PARA O TÉRMINO DO MENOR PRAZO</div>
      </div>
      <div style="padding:24px;">
        <p style="font-size:14px;line-height:1.5;">Prezado(a) <strong>Franqueado(a)</strong> e Equipe Operacional,</p>
        <p style="font-size:13px;color:#4B5563;line-height:1.5;">Este é um comunicado de <strong>PREVENÇÃO</strong> do Spoleto Radar. O prazo mais curto do Plano de Ação da sua unidade <strong>vence amanhã (${sla.formattedMinDueDate})</strong>.</p>
        <div style="background:#FAF8F5;border-left:4px solid #F59E0B;padding:14px;border-radius:6px;margin-bottom:20px;">
          <div><strong style="color:#5D3826;font-size:15px;">${store.name}</strong> (Código RP: ${store.code})</div>
          <div style="font-size:12px;color:#6B7280;margin-top:4px;">📍 ${store.city || ''} / ${store.state || ''} &bull; Consultor(a): ${consultant?.name || 'Spoleto'}</div>
        </div>
        <h3 style="font-size:14px;color:#5D3826;margin:18px 0 8px 0;">📋 Ações Operacionais Pendentes:</h3>
        <table style="width:100%;border-collapse:collapse;margin-top:14px;font-size:13px;">
          <thead>
            <tr style="background:#5D3826;color:#FFFFFF;">
              <th style="padding:10px;text-align:left;font-size:12px;">Tema & Apontamento</th>
              <th style="padding:10px;text-align:left;font-size:12px;">Ação Requerida</th>
              <th style="padding:10px;text-align:left;font-size:12px;">Prazo</th>
              <th style="padding:10px;text-align:left;font-size:12px;">Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="background:#F3F4F6;padding:12px;border-radius:6px;font-size:12px;margin-top:20px;border:1px solid #E5E7EB;">
          <strong>👥 Cadeia em Cópia Notificada:</strong><br>
          • Franqueado(a): <em>${store.email || 'Franqueado Spoleto'}</em><br>
          • Consultor(a): <em>${consultant?.email || 'Consultoria de Negócios'}</em><br>
          • Gerente Regional: <em>${regionalManager?.email || 'Gerência Regional'}</em><br>
          • Gerente Nacional: <em>${nationalManager?.email || 'liliane.cury@spoleto.com.br'}</em>
        </div>
      </div>
      <div style="text-align:center;padding:16px;font-size:11px;color:#8C7B70;border-top:1px solid #EAE3D9;background:#FAF8F5;">
        Spoleto Radar &bull; Grupo Trigo &bull; E-mail automático de prevenção de prazos
      </div>
    </div>
  </body>
  </html>`;
}

// Generate D-0 Critical Escalation Email HTML
function buildD0EmailHtml({ store, consultant, regionalManager, nationalManager, sla, visitDate }) {
  const rows = (sla.openItems || []).map(it => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #FEE2E2;"><strong>[${it.categoryName}]</strong><br>${it.subproblemTitle}</td>
      <td style="padding: 10px; border-bottom: 1px solid #FEE2E2;">${it.action}</td>
      <td style="padding: 10px; border-bottom: 1px solid #FEE2E2;"><strong>${it.formattedDueDate}</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #FEE2E2;"><span style="background:#FEE2E2;color:#991B1B;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:800;">${it.status} ⚠️</span></td>
    </tr>
  `).join('');

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="font-family:'Segoe UI',Arial,sans-serif;background-color:#FAF8F5;margin:0;padding:20px;color:#2D241E;">
    <div style="max-width:620px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;border:1.5px solid #DC2626;box-shadow:0 4px 20px rgba(220,38,38,0.15);">
      <div style="background:linear-gradient(135deg,#7F1D1D 0%,#991B1B 50%,#450A0A 100%);padding:24px;color:#FFFFFF;text-align:center;">
        <h1 style="margin:0;font-size:20px;font-weight:800;">🚨 ESCALAÇÃO EXECUTIVA • ATENÇÃO TOTAL E ABSOLUTA</h1>
        <p style="margin:6px 0 0 0;font-size:13px;opacity:0.9;">Grupo Trigo / Spoleto &bull; Gestão de Qualidade & Padrão de Rede</p>
        <div style="background:#FEE2E2;color:#991B1B;border:1px solid #EF4444;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:800;display:inline-block;margin-top:10px;">⚠️ PRAZO OPERACIONAL ESGOTADO (EM ATRASO)</div>
      </div>
      <div style="padding:24px;">
        <p style="font-size:14px;line-height:1.5;font-weight:700;color:#991B1B;">ATENÇÃO: Franqueado(a), Consultoria de Negócios, Gerência Regional e Gerência Nacional,</p>
        <p style="font-size:13px;color:#4B5563;line-height:1.5;">Comunicamos formalmente que o prazo operacional para resolução das não-conformidades críticas da unidade abaixo <strong>EXPIROU</strong> e constam pendências graves não baixadas no sistema.</p>
        <div style="background:#FEF2F2;border-left:4px solid #DC2626;padding:14px;border-radius:6px;margin-bottom:20px;">
          <div><strong style="color:#991B1B;font-size:15px;">${store.name}</strong> (Código RP: ${store.code})</div>
          <div style="font-size:12px;color:#991B1B;margin-top:4px;">📍 ${store.city || ''} / ${store.state || ''} &bull; <strong>Prazo limite era: ${sla.formattedMinDueDate} (${sla.daysOverdue === 0 ? 'Expira Hoje' : `${sla.daysOverdue} dias em atraso`})</strong></div>
        </div>
        <h3 style="font-size:14px;color:#991B1B;margin:18px 0 8px 0;">📋 Não-Conformidades em Atraso:</h3>
        <table style="width:100%;border-collapse:collapse;margin-top:14px;font-size:13px;">
          <thead>
            <tr style="background:#991B1B;color:#FFFFFF;">
              <th style="padding:10px;text-align:left;font-size:12px;">Tema Crítico</th>
              <th style="padding:10px;text-align:left;font-size:12px;">Ação Imediata</th>
              <th style="padding:10px;text-align:left;font-size:12px;">Prazo</th>
              <th style="padding:10px;text-align:left;font-size:12px;">Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="background:#FFF1F2;border:1px solid #FDA4AF;border-radius:6px;padding:14px;margin-top:18px;font-size:12.5px;color:#9F1239;line-height:1.5;">
          <strong>⚠️ DETERMINAÇÃO DIRETIVA:</strong><br>
          1. O Franqueado deve providenciar a regularização imediata das pendências operacionais.<br>
          2. O Consultor de Negócios deve validar a correção em loja com envio de fotos comprobatórias.<br>
          3. A Gerência Regional e Nacional acompanharão a resolução com intervenção direta caso persista.
        </div>
        <div style="background:#F3F4F6;padding:12px;border-radius:6px;font-size:12px;margin-top:20px;border:1px solid #E5E7EB;">
          <strong>👥 Notificação Enviada em Cópia Consolidada:</strong><br>
          • Franqueado(a): <em>${store.email || 'Franqueado Spoleto'}</em><br>
          • Consultor(a): <em>${consultant?.email || 'Consultoria de Negócios'}</em><br>
          • Gerente Regional: <em>${regionalManager?.email || 'Gerência Regional'}</em><br>
          • Gerente Nacional: <em>${nationalManager?.email || 'liliane.cury@spoleto.com.br'}</em>
        </div>
      </div>
      <div style="text-align:center;padding:16px;font-size:11px;color:#8C7B70;border-top:1px solid #EAE3D9;background:#FAF8F5;">
        Spoleto Radar &bull; Grupo Trigo &bull; Notificação formal de escalação executiva de rede
      </div>
    </div>
  </body>
  </html>`;
}

// Envia e-mail via Resend API
async function sendResendEmail({ to, subject, html, text }) {
  if (!RESEND_API_KEY) return { success: false, error: 'Sem chave Resend' };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Spoleto Radar <onboarding@resend.dev>',
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text
      })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data?.message || 'Erro no envio' };
    return { success: true, id: data.id };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Handler principal do Vercel Serverless Cron Job
 */
export default async function handler(req, res) {
  const startTime = Date.now();
  console.log('[CRON-SLA] Iniciando verificação diária de prazos (SLA) Spoleto Radar...');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // 1. Carregar dados do Supabase
  const [{ data: stores }, { data: consultants }, { data: visits }, { data: categories }] = await Promise.all([
    supabase.from('stores').select('*'),
    supabase.from('consultants').select('*'),
    supabase.from('visits').select('*'),
    supabase.from('categories').select('*')
  ]);

  if (!visits || visits.length === 0) {
    return res.status(200).json({ success: true, message: 'Nenhuma visita cadastrada para verificação.' });
  }

  const nationalManager = (consultants || []).find(c => c.role === 'GERENTE_NACIONAL') || {
    name: 'LILIANE TAHAN CURY TEIXEIRA DE RESENDE',
    email: 'liliane.cury@spoleto.com.br'
  };

  const results = {
    evaluatedVisits: visits.length,
    dMinusOneSent: 0,
    dZeroSent: 0,
    alreadySentSkipped: 0,
    errors: [],
    details: []
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // 2. Avaliar cada visita com planos em aberto
  for (const v of visits) {
    const store = (stores || []).find(s => s.id === v.store_id || s.id === v.storeId);
    const consultant = (consultants || []).find(c => c.id === v.consultant_id || c.id === v.consultantId);
    const regionalManager = consultant?.reports_to || consultant?.reportsTo
      ? (consultants || []).find(c => c.id === (consultant.reports_to || consultant.reportsTo))
      : (consultants || []).find(c => c.region === consultant?.region && c.role === 'GERENTE_REGIONAL') || null;

    const sla = getVisitCriticalSla(v, categories || []);
    if (!sla || !sla.hasOpenPlans) continue;

    // Verificar se é D-1 ou D-0
    const isD1 = sla.isDMinusOne;
    const isD0 = sla.isDZeroOrOverdue;

    if (!isD1 && !isD0) continue;

    const notifType = isD1 ? 'PREVENTION_D1' : 'ESCALATION_D0';

    // 3. Verificar se já enviou hoje para evitar duplicidade
    const { data: existingNotifs } = await supabase
      .from('notifications')
      .select('id, sent_at')
      .eq('visit_id', v.id)
      .eq('type', notifType)
      .gte('sent_at', `${todayStr}T00:00:00Z`);

    if (existingNotifs && existingNotifs.length > 0) {
      results.alreadySentSkipped++;
      continue;
    }

    // 4. Montar e-mail e disparar
    const subject = isD1
      ? `⚠️ [PREVENÇÃO SPOLETO] Faltam 24h para o prazo do Plano de Ação - Unidade ${store?.name || 'Spoleto'} [${store?.code || 'SPO'}]`
      : `🚨 [ESCALAÇÃO URGENTE • ATENÇÃO TOTAL] Prazo Esgotado (${sla.daysOverdue}d em atraso) - Unidade ${store?.name || 'Spoleto'} [${store?.code || 'SPO'}]`;

    const html = isD1
      ? buildD1EmailHtml({ store: store || {}, consultant, regionalManager, nationalManager, sla, visitDate: v.date })
      : buildD0EmailHtml({ store: store || {}, consultant, regionalManager, nationalManager, sla, visitDate: v.date });

    const recipients = [
      store?.email,
      consultant?.email,
      regionalManager?.email,
      nationalManager?.email
    ].filter(Boolean);

    // Extrai todos os e-mails dos franqueados/loja (tratando múltiplos sócios separados por vírgula)
    let storeEmails = (store?.email || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(e => Boolean(e) && e.includes('@'));

    if (storeEmails.length === 0 && consultant?.email) {
      storeEmails = [consultant.email.toLowerCase().trim()];
    }
    if (storeEmails.length === 0) {
      storeEmails = ['lhukas@gmail.com'];
    }

    let sendRes = await sendResendEmail({
      to: storeEmails,
      subject,
      html,
      text: `Notificação oficial Spoleto Radar (${notifType}) para ${store?.name}.`
    });

    // Se falhar por restrição de conta de teste no Resend, tenta enviar para o e-mail verificado do dono da conta
    if (!sendRes.success && sendRes.error?.includes('You can only send testing emails')) {
      storeEmails = ['lhukas@gmail.com'];
      sendRes = await sendResendEmail({
        to: ['lhukas@gmail.com'],
        subject: `[TESTE AUTOMÁTICO CRON] ${subject}`,
        html,
        text: `Notificação oficial Spoleto Radar (${notifType}) para ${store?.name}.`
      });
    }

    if (sendRes.success) {
      if (isD1) results.dMinusOneSent++;
      if (isD0) results.dZeroSent++;

      // 5. Gravar registro no Supabase
      await supabase.from('notifications').insert({
        id: `cron-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: notifType,
        title: subject,
        message: `Disparo automático de menor prazo (${sla.formattedMinDueDate}) via Vercel Cron.`,
        recipient_email: storeEmails.join(', '),
        channel: 'email',
        status: 'sent',
        store_id: store?.id,
        visit_id: v.id,
        sent_at: new Date().toISOString()
      });

      results.details.push({
        store: store?.name,
        code: store?.code,
        type: notifType,
        minDeadline: sla.formattedMinDueDate,
        sentTo: targetEmail,
        emailId: sendRes.id
      });
    } else {
      results.errors.push({ store: store?.name, error: sendRes.error });
    }
  }

  const durationMs = Date.now() - startTime;
  console.log(`[CRON-SLA] Concluído em ${durationMs}ms:`, results);

  return res.status(200).json({
    success: true,
    durationMs,
    timestamp: new Date().toISOString(),
    results
  });
}
