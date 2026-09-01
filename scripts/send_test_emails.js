import fs from 'fs';

// Ler chave do .env local com segurança sem expor no repositório
let RESEND_API_KEY = process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;
if (!RESEND_API_KEY && fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const match = envContent.match(/VITE_RESEND_API_KEY=(.*)/);
  if (match) RESEND_API_KEY = match[1].trim();
}
const TO_EMAIL = 'lhukas@gmail.com';

async function sendEmail({ subject, html, text }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Spoleto Radar <onboarding@resend.dev>',
      to: [TO_EMAIL],
      subject: subject,
      html: html,
      text: text
    })
  });

  const data = await response.json();
  return { status: response.status, data };
}

// 1. Template D-1: Alerta Preventivo (Faltam 24h)
const d1Subject = '⚠️ [PREVENÇÃO SPOLETO] Faltam 24h para o prazo do Plano de Ação - Unidade SPOLETO MAG SHOPPING [SPO-001]';
const d1Html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #FAF8F5; margin: 0; padding: 20px; color: #2D241E; }
    .container { max-width: 620px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #EAE3D9; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #78350F 0%, #B45309 100%); padding: 24px; color: #FFFFFF; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }
    .badge-d1 { background: #FEF3C7; color: #92400E; border: 1px solid #F59E0B; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 800; display: inline-block; margin-top: 8px; }
    .content { padding: 24px; }
    .store-card { background: #FAF8F5; border-left: 4px solid #F59E0B; padding: 14px; border-radius: 6px; margin-bottom: 20px; }
    .store-card strong { color: #5D3826; font-size: 15px; }
    .table-plans { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 13px; }
    .table-plans th { background: #5D3826; color: #FFFFFF; padding: 10px; text-align: left; font-size: 12px; }
    .table-plans td { padding: 10px; border-bottom: 1px solid #EAE3D9; }
    .status-badge { background: #FEF3C7; color: #92400E; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
    .chain-box { background: #F3F4F6; padding: 12px; border-radius: 6px; font-size: 12px; margin-top: 20px; border: 1px solid #E5E7EB; }
    .footer { text-align: center; padding: 16px; font-size: 11px; color: #8C7B70; border-top: 1px solid #EAE3D9; background: #FAF8F5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SPOLETO RADAR • AVISO PREVENTIVO (D-1)</h1>
      <p>Grupo Trigo • Monitoramento 360° de Padrões & Operações</p>
      <div class="badge-d1">⏳ FALTAM 24 HORAS PARA O TÉRMINO DO MENOR PRAZO</div>
    </div>
    <div class="content">
      <p style="font-size: 14px; line-height: 1.5;">
        Prezado(a) <strong>Franqueado(a)</strong> e Equipe Operacional,
      </p>
      <p style="font-size: 13px; color: #4B5563; line-height: 1.5;">
        Este é um comunicado de <strong>PREVENÇÃO</strong> do Spoleto Radar. Identificamos que o prazo mais curto do Plano de Ação acordado na última visita técnica <strong>vence amanhã (02/09/2026)</strong>.
      </p>

      <div class="store-card">
        <div><strong>SPOLETO MAG SHOPPING</strong> (Código RP: SPO-001)</div>
        <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">📍 João Pessoa / PB &bull; Consultor(a): Alex de Bristo</div>
      </div>

      <h3 style="font-size: 14px; color: #5D3826; margin: 18px 0 8px 0;">📋 Ações Operacionais Pendentes:</h3>
      <table class="table-plans">
        <thead>
          <tr>
            <th>Tema & Apontamento</th>
            <th>Ação Requerida</th>
            <th>Prazo</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>[PRODUTO]</strong><br>Massa fora do ponto (Al dente)</td>
            <td>Reciclar equipe no timer oficial de cocção.</td>
            <td><strong>02/09/2026</strong><br><span style="color:#B45309;font-size:11px;">(Vence Amanhã)</span></td>
            <td><span class="status-badge">EM ANDAMENTO</span></td>
          </tr>
          <tr>
            <td><strong>[EQUIPE]</strong><br>Uniformização incompleta no salão</td>
            <td>Fornecer toucas e aventais padrão Spoleto.</td>
            <td>08/09/2026</td>
            <td><span class="status-badge">NÃO INICIADO</span></td>
          </tr>
        </tbody>
      </table>

      <div class="chain-box">
        <strong>👥 Cadeia em Cópia Notificada:</strong><br>
        • Franqueado(a): <em>lucas@infodesk.net.br</em><br>
        • Consultor(a): <em>alex.bristo@spoleto.com.br</em><br>
        • Gerente Regional: <em>anaketlim.cruz@spoleto.com.br (Anaketlim Westarb Cruz)</em><br>
        • Gerente Nacional: <em>liliane.cury@spoleto.com.br (Liliane Cury)</em>
      </div>

      <p style="font-size: 12px; color: #6B7280; margin-top: 18px; line-height: 1.4;">
        💡 <em>Recomendação: Favor providenciar a conclusão para manter 100% de conformidade da sua unidade antes do término do prazo.</em>
      </p>
    </div>
    <div class="footer">
      Spoleto Radar &bull; Grupo Trigo &bull; E-mail automático de prevenção de prazos
    </div>
  </div>
</body>
</html>
`;

// 2. Template D-0: Escalação de Atenção Total e Absoluta
const d0Subject = '🚨 [ESCALAÇÃO URGENTE • ATENÇÃO TOTAL] Prazo Esgotado para Plano de Ação - Unidade SPOLETO MAG SHOPPING [SPO-001]';
const d0Html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #FAF8F5; margin: 0; padding: 20px; color: #2D241E; }
    .container { max-width: 620px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1.5px solid #DC2626; box-shadow: 0 4px 20px rgba(220,38,38,0.15); }
    .header { background: linear-gradient(135deg, #7F1D1D 0%, #991B1B 50%, #450A0A 100%); padding: 24px; color: #FFFFFF; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }
    .badge-d0 { background: #FEE2E2; color: #991B1B; border: 1px solid #EF4444; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 800; display: inline-block; margin-top: 10px; }
    .content { padding: 24px; }
    .store-card { background: #FEF2F2; border-left: 4px solid #DC2626; padding: 14px; border-radius: 6px; margin-bottom: 20px; }
    .store-card strong { color: #991B1B; font-size: 15px; }
    .table-plans { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 13px; }
    .table-plans th { background: #991B1B; color: #FFFFFF; padding: 10px; text-align: left; font-size: 12px; }
    .table-plans td { padding: 10px; border-bottom: 1px solid #FEE2E2; }
    .status-badge { background: #FEE2E2; color: #991B1B; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 800; }
    .alert-box { background: #FFF1F2; border: 1px solid #FDA4AF; border-radius: 6px; padding: 14px; margin-top: 18px; font-size: 12.5px; color: #9F1239; line-height: 1.5; }
    .chain-box { background: #F3F4F6; padding: 12px; border-radius: 6px; font-size: 12px; margin-top: 20px; border: 1px solid #E5E7EB; }
    .footer { text-align: center; padding: 16px; font-size: 11px; color: #8C7B70; border-top: 1px solid #EAE3D9; background: #FAF8F5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 ESCALAÇÃO EXECUTIVA • ATENÇÃO TOTAL E ABSOLUTA</h1>
      <p>Grupo Trigo / Spoleto &bull; Gestão de Qualidade & Padrão de Rede</p>
      <div class="badge-d0">⚠️ PRAZO OPERACIONAL ESGOTADO (EM ATRASO)</div>
    </div>
    <div class="content">
      <p style="font-size: 14px; line-height: 1.5; font-weight: 700; color: #991B1B;">
        ATENÇÃO: Franqueado(a), Consultoria de Negócios, Gerência Regional e Gerência Nacional,
      </p>
      <p style="font-size: 13px; color: #4B5563; line-height: 1.5;">
        Comunicamos formalmente que o prazo operacional para resolução das não-conformidades críticas da unidade abaixo <strong>EXPIROU</strong> e constam pendências graves não baixadas no sistema.
      </p>

      <div class="store-card">
        <div><strong>SPOLETO MAG SHOPPING</strong> (Código RP: SPO-001)</div>
        <div style="font-size: 12px; color: #991B1B; margin-top: 4px;">📍 João Pessoa / PB &bull; <strong>Prazo limite era: 29/08/2026 (3 dias em atraso)</strong></div>
      </div>

      <h3 style="font-size: 14px; color: #991B1B; margin: 18px 0 8px 0;">📋 Não-Conformidades em Atraso:</h3>
      <table class="table-plans">
        <thead>
          <tr>
            <th>Tema Crítico</th>
            <th>Ação Imediata</th>
            <th>Responsável</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>[HIGIENE & SEGURANÇA ALIMENTAR]</strong><br>Validade / PVPS de Molhos e Queijos</td>
            <td>Descarte de itens vencidos e etiquetagem imediata.</td>
            <td>GERENTE</td>
            <td><span class="status-badge">NÃO INICIADO ⚠️</span></td>
          </tr>
        </tbody>
      </table>

      <div class="alert-box">
        <strong>⚠️ DETERMINAÇÃO DIRETIVA:</strong><br>
        1. O Franqueado deve providenciar a regularização imediata das pendências operacionais.<br>
        2. O Consultor de Negócios deve validar a correção em loja com envio de fotos comprobatórias.<br>
        3. A Gerência Regional e Nacional acompanharão a resolução com intervenção direta caso persista.
      </div>

      <div class="chain-box">
        <strong>👥 Notificação Enviada em Cópia Consolidada:</strong><br>
        • Franqueado(a): <em>lucas@infodesk.net.br</em><br>
        • Consultor(a): <em>alex.bristo@spoleto.com.br (Alex de Bristo)</em><br>
        • Gerente Regional: <em>anaketlim.cruz@spoleto.com.br (Anaketlim Westarb Cruz)</em><br>
        • Gerente Nacional: <em>liliane.cury@spoleto.com.br (Liliane Cury)</em>
      </div>
    </div>
    <div class="footer">
      Spoleto Radar &bull; Grupo Trigo &bull; Notificação formal de escalação executiva de rede
    </div>
  </div>
</body>
</html>
`;

async function main() {
  console.log('🚀 Disparando E-mail 1 (D-1 Prevenção) para ' + TO_EMAIL + '...');
  const res1 = await sendEmail({
    subject: d1Subject,
    html: d1Html,
    text: 'SPOLETO RADAR: Alerta Preventivo (D-1) para SPOLETO MAG SHOPPING.'
  });
  console.log('Resultado D-1:', res1);

  console.log('\n🚀 Disparando E-mail 2 (D-0 Atenção Total) para ' + TO_EMAIL + '...');
  const res2 = await sendEmail({
    subject: d0Subject,
    html: d0Html,
    text: 'SPOLETO RADAR: Escalação Crítica de Atenção Total (D-0) para SPOLETO MAG SHOPPING.'
  });
  console.log('Resultado D-0:', res2);
}

main();
