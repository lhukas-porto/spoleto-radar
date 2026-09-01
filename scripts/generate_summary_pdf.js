import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

async function generateExecutiveSummaryPDF() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header Banner
  doc.setFillColor(93, 56, 38); // Spoleto Brown (#5D3826)
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Accent Gold Line
  doc.setFillColor(245, 158, 11); // Gold (#F59E0B)
  doc.rect(0, 32, pageWidth, 2.5, 'F');

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('SPOLETO RADAR — RELATÓRIO EXECUTIVO DE ENTREGAS', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(232, 223, 216);
  doc.text('Resumo Consolidado das Implementações e Melhorias do Sistema • Grupo Trigo', margin, 22);

  y = 42;

  // Metadata Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);

  doc.text('DATA: 01/09/2026', margin + 5, y + 7);
  doc.text('PROJETO: Spoleto Radar (409 Unidades)', margin + 5, y + 14);

  doc.text('STATUS: 100% Em Produção (Vercel + Supabase)', margin + 85, y + 7);
  doc.text('RESPONSÁVEL: Lucas Porto', margin + 85, y + 14);

  y += 30;

  // Helper to draw section title
  const drawSectionTitle = (title, iconCode) => {
    // Check page break
    if (y > pageHeight - 35) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(93, 56, 38);
    doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(title, margin + 4, y + 5);
    y += 10;
  };

  // Helper to draw bullet item
  const drawBullet = (boldTitle, desc) => {
    if (y > pageHeight - 25) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(245, 158, 11);
    doc.circle(margin + 3, y + 1.2, 1.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(boldTitle, margin + 7, y + 2);

    const titleWidth = doc.getTextWidth(boldTitle) + 1;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    const fullText = desc;
    const lines = doc.splitTextToSize(fullText, contentWidth - 10);

    doc.text(lines, margin + 7, y + 6);
    y += 6 + (lines.length * 4) + 1.5;
  };

  // 1. BANCO DE DADOS
  drawSectionTitle('1. BANCO DE DADOS & INFRAESTRUTURA SUPABASE v2.0');
  drawBullet(
    'Migração Segura (Zero Perda de Dados):',
    'Criação das novas tabelas "regions", "action_plans", "notifications" e da View em tempo real "v_action_plans", preservando 100% dos dados pré-existentes.'
  );
  drawBullet(
    'Estruturação Completa de Dados:',
    'Adição de colunas estruturadas para endereço completo, CEP, franqueado, consultor responsável, hierarquia/cargo dos membros e horários exatos de início e término.'
  );

  y += 2;

  // 2. GESTÃO DE EQUIPE
  drawSectionTitle('2. GESTÃO DE EQUIPE & HIERARQUIA SPOLETO');
  drawBullet(
    'Hierarquia Corporativa em 4 Níveis:',
    'Visualização integrada por Diretoria, Gerência Nacional, Gerentes Regionais e Consultores de Negócios.'
  );
  drawBullet(
    'Ficha 360° vs. Foto Ampliada:',
    'Ao clicar no nome do colaborador abre a Ficha 360° completa. Ao clicar no avatar/foto abre exclusivamente a foto em alta resolução centralizada.'
  );
  drawBullet(
    'Gerenciamento de Membros & Liderança:',
    'Exclusão direta com confirmação e modal para reatribuição de liderados e lojas.'
  );

  y += 2;

  // 3. REDE DE LOJAS
  drawSectionTitle('3. REDE DE 409 LOJAS & AUTOMAÇÃO DE ENDEREÇOS');
  drawBullet(
    'Autopreenchimento Inteligente por CEP (ViaCEP):',
    'Busca instantânea que preenche Estado, Município e Logradouro ao digitar o CEP.'
  );
  drawBullet(
    'Cobertura Completa do Distrito Federal (DF):',
    'Inclusão oficial das 37 Regiões Administrativas do DF + lista oficial de municípios do IBGE.'
  );
  drawBullet(
    'Padronização Corporativa:',
    'Nomes e franqueados sempre em caixa alta, e-mails em minúsculas e formatação padrão de telefone brasileiro.'
  );

  y += 2;

  // 4. AUDITORIA EM LOJA & LAUDO OFICIAL
  drawSectionTitle('4. AUDITORIA EM LOJA & LAUDO OFICIAL APRIMORADO');
  drawBullet(
    'Autopreenchimento de Horário de Término:',
    'Ao finalizar a visita, o campo de horário final é capturado com a hora exata do momento (com botão "[⏱️ Agora]").'
  );
  drawBullet(
    'Apresentação Executiva do Período & Duração:',
    'Separação explícita de "Início da Visita" e "Término da Visita" acompanhada pelo selo compilado de tempo de auditoria (ex: [⌛ 1h 30min de auditoria]).'
  );
  drawBullet(
    'Assinatura Digital & Laudo PDF:',
    'Coleta de assinaturas do gerente da unidade e do consultor com exportação em PDF e compartilhamento WhatsApp/E-mail.'
  );

  y += 2;

  // 5. DETECTOR DE REINCIDÊNCIA
  drawSectionTitle('5. INTELIGÊNCIA OPERACIONAL & DETECTOR DE REINCIDÊNCIAS');
  drawBullet(
    'Alerta Proativo no Preenchimento:',
    'O sistema identifica se a não-conformidade já ocorreu em auditorias anteriores daquela loja e exibe alerta âmbar imediato com data e contador de ocorrências.'
  );
  drawBullet(
    'Tag no Laudo Oficial:',
    'Destaque com o badge "[⚠️ REINCIDENTE]" na coluna Tema/Causa do Plano de Ação Oficial.'
  );

  y += 2;

  // 6. FICHA 360° DA LOJA & EVOLUÇÃO
  drawSectionTitle('6. FICHA 360° DA LOJA & CURVA DE EVOLUÇÃO HISTÓRICA');
  drawBullet(
    'Ficha Completa da Unidade:',
    'Acessível via clique no nome da loja ou botão "[📊 Ficha 360°]", trazendo dados cadastrais, consultor, taxa de resolução e pendências.'
  );
  drawBullet(
    'Linha do Tempo & Gráfico de Evolução (Sparkline):',
    'Gráfico visual comparando visitas anteriores e medindo a queda ou aumento de problemas na loja.'
  );
  drawBullet(
    '3 Abas de Gestão Dedicadas:',
    'Histórico de visitas com acesso a laudos passados, ranking de problemas reincidentes e todos os planos de ação pendentes.'
  );

  // Footer em todas as páginas
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Spoleto Radar • Sistema Oficial de Gestão de Operações e Qualidade • Grupo Trigo', margin, pageHeight - 7);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, pageHeight - 7);
  }

  // Paths to save
  const workspacePath = path.resolve('c:/Vibecoding/spoleto-radar/Spoleto_Radar_Resumo_Executivo.pdf');
  const publicPath = path.resolve('c:/Vibecoding/spoleto-radar/public/Spoleto_Radar_Resumo_Executivo.pdf');
  const artifactPath = path.resolve('C:/Users/lucas/.gemini/antigravity-ide/brain/abbf5b17-d78f-4cf8-babf-204765e8f7f7/Spoleto_Radar_Resumo_Executivo.pdf');

  const pdfData = doc.output('arraybuffer');
  const buffer = Buffer.from(pdfData);

  fs.writeFileSync(workspacePath, buffer);
  console.log('Saved to:', workspacePath);

  fs.writeFileSync(publicPath, buffer);
  console.log('Saved to:', publicPath);

  try {
    fs.writeFileSync(artifactPath, buffer);
    console.log('Saved to:', artifactPath);
  } catch (e) {
    console.warn('Could not save to artifact dir:', e.message);
  }

  console.log('Executive Summary PDF generated successfully!');
}

generateExecutiveSummaryPDF().catch(console.error);
