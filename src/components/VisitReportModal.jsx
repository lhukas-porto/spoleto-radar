import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import SpoletoRadarLogo from './SpoletoRadarLogo';
import DigitalSignatureModal from './DigitalSignatureModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Store, 
  User, 
  Calendar, 
  Clock, 
  FileText,
  Building2,
  Tag,
  Share2,
  Mail,
  Send,
  Check,
  Download,
  MessageSquare,
  FileDown,
  Loader2,
  Paperclip,
  Info,
  PenTool,
  ShieldCheck,
  Camera,
  ZoomIn,
  Edit3,
  Trash2
} from 'lucide-react';

export default function VisitReportModal() {
  const { 
    selectedVisitForReport, 
    setSelectedVisitForReport, 
    stores, 
    consultants, 
    categories, 
    showToast, 
    updateVisit,
    startEditVisit,
    deleteVisit,
    setSelectedStaffForProfile
  } = useApp();

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [zoomedPhoto, setZoomedPhoto] = useState(null);
  const [shareChannel, setShareChannel] = useState('whatsapp'); // 'whatsapp' | 'email' | 'both'
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showAttachGuide, setShowAttachGuide] = useState(false);

  const reportRef = useRef(null);

  if (!selectedVisitForReport) return null;

  const visit = selectedVisitForReport;
  const store = stores.find(s => s.id === visit.storeId);
  const consultant = consultants.find(c => c.id === visit.consultantId);

  // Helper to generate PDF Blob
  const createPdfBlob = async () => {
    if (!reportRef.current) return null;

    const element = reportRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#FFFFFF'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    const cleanStoreName = (store?.name || 'Spoleto').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Plano_de_Acao_Spoleto_${cleanStoreName}_${visit.date}.pdf`;
    const blob = pdf.output('blob');

    return { pdf, blob, fileName };
  };

  // Generate & Download Real PDF File
  const generateAndDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const result = await createPdfBlob();
      if (result) {
        result.pdf.save(result.fileName);
        showToast(`PDF "${result.fileName}" baixado com sucesso!`);
      }
      setIsGeneratingPdf(false);
      return result;
    } catch (err) {
      console.error('Error generating PDF:', err);
      setIsGeneratingPdf(false);
      window.print();
      return null;
    }
  };

  // WhatsApp Message
  const generateWhatsAppMessage = () => {
    const formattedDate = new Date(visit.date + 'T12:00:00').toLocaleDateString('pt-BR');

    let msg = `🎯 *SPOLETO - PLANO DE AÇÃO OFICIAL* 📋\n\n`;
    msg += `Olá! O relatório e plano de ação oficial em *PDF* da unidade *${store?.name}* referente à visita de Consultoria de Negócios em *${formattedDate}* foi gerado.\n\n`;
    msg += `📎 *Segue o arquivo PDF anexo para execução e acompanhamento das ações pontuadas.*\n\n`;
    msg += `👨‍💼 *Consultor(a):* ${consultant?.name || 'Consultoria de Negócios'}\n`;
    msg += `_Spoleto Radar • Consultoria de Negócios_`;

    return msg;
  };

  // E-mail format
  const getEmailSubject = () => {
    return `[SPOLETO] Plano de Ação Oficial em PDF - ${store?.name} (${store?.code})`;
  };

  const getEmailBody = () => {
    const formattedDate = new Date(visit.date + 'T12:00:00').toLocaleDateString('pt-BR');

    let body = `Prezada equipe da unidade ${store?.name} [${store?.code}],\n\n`;
    body += `Segue em anexo o documento oficial em PDF do Plano de Ação referente à visita de Consultoria de Negócios realizada em ${formattedDate}.\n\n`;
    body += `Favor dar andamento imediato nas ações corretivas pontuadas com os respectivos responsáveis e prazos.\n\n`;
    body += `Atenciosamente,\n`;
    body += `${consultant?.name || 'Consultor(a) de Negócios'}\n`;
    body += `Consultoria de Negócios Spoleto\n`;
    return body;
  };

  // Native Web Share API (Directly sends file on supported browsers/Windows/Mobile)
  const handleNativeShareFile = async () => {
    setIsGeneratingPdf(true);
    try {
      const result = await createPdfBlob();
      if (!result) return;

      const file = new File([result.blob], result.fileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Plano de Ação Spoleto',
          text: generateWhatsAppMessage(),
          files: [file]
        });
        showToast('PDF compartilhado com sucesso!');
      } else {
        // Fallback: Download file & open WhatsApp
        result.pdf.save(result.fileName);
        const text = encodeURIComponent(generateWhatsAppMessage());
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
        setShowAttachGuide(true);
      }
      setIsGeneratingPdf(false);
    } catch (err) {
      console.error('Error sharing:', err);
      setIsGeneratingPdf(false);
    }
  };

  const handleSendWhatsApp = async (customPhone) => {
    const result = await createPdfBlob();
    if (result) {
      result.pdf.save(result.fileName);
    }

    const text = encodeURIComponent(generateWhatsAppMessage());
    let url = `https://api.whatsapp.com/send?text=${text}`;
    if (customPhone) {
      const cleanPhone = customPhone.replace(/\D/g, '');
      url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`;
    }
    window.open(url, '_blank');
    setShowAttachGuide(true);
    showToast('PDF baixado! Anexe o arquivo PDF na conversa do WhatsApp aberta.');
  };

  const handleSendEmail = async (customEmail) => {
    const result = await createPdfBlob();
    if (result) {
      result.pdf.save(result.fileName);
    }

    const subject = encodeURIComponent(getEmailSubject());
    const body = encodeURIComponent(getEmailBody());
    const emailTo = customEmail || store?.email || '';
    const mailtoUrl = `mailto:${emailTo}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
    setShowAttachGuide(true);
    showToast('PDF baixado! Anexe o arquivo PDF no seu e-mail.');
  };

  const handleOpenShareModal = (channel) => {
    setShareChannel(channel);
    setRecipientPhone(store?.phone || consultant?.phone || '');
    setRecipientEmail(store?.email || 'gerencia@spoleto.com.br');
    setIsShareModalOpen(true);
  };

  const handleExecuteSend = async () => {
    setIsGeneratingPdf(true);
    if (shareChannel === 'whatsapp') {
      await handleSendWhatsApp(recipientPhone);
    } else if (shareChannel === 'email') {
      await handleSendEmail(recipientEmail);
    } else if (shareChannel === 'both') {
      const result = await createPdfBlob();
      if (result) {
        result.pdf.save(result.fileName);
      }
      const text = encodeURIComponent(generateWhatsAppMessage());
      let waUrl = `https://api.whatsapp.com/send?text=${text}`;
      if (recipientPhone) {
        const cleanPhone = recipientPhone.replace(/\D/g, '');
        waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`;
      }
      window.open(waUrl, '_blank');

      setTimeout(() => {
        const subject = encodeURIComponent(getEmailSubject());
        const body = encodeURIComponent(getEmailBody());
        const mailtoUrl = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
        window.location.href = mailtoUrl;
      }, 700);

      setShowAttachGuide(true);
      showToast('PDF baixado! Anexe o arquivo PDF no WhatsApp e no E-mail.');
    }
    setIsGeneratingPdf(false);
    setIsShareModalOpen(false);
  };

  return (
    <div className="modal-overlay" onClick={() => setSelectedVisitForReport(null)}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '980px', padding: '2.25rem', width: '95%' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Controls Bar (No Print) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Laudo & Plano de Ação Oficial Spoleto
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              type="button"
              className="btn-secondary" 
              onClick={() => setIsSignatureModalOpen(true)}
              style={{ 
                fontSize: '0.82rem', 
                padding: '0.45rem 0.85rem', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.35rem',
                borderColor: visit.signatures?.consultantImg || visit.signatures?.storeImg ? '#86EFAC' : 'var(--border-strong)',
                backgroundColor: visit.signatures?.consultantImg || visit.signatures?.storeImg ? '#F0FDF4' : '#FFFFFF',
                color: visit.signatures?.consultantImg || visit.signatures?.storeImg ? '#166534' : 'var(--text-main)',
                fontWeight: 700
              }}
              title="Coletar assinaturas digitais na tela com o dedo ou mouse"
            >
              <PenTool size={15} color={visit.signatures?.consultantImg || visit.signatures?.storeImg ? '#16A34A' : 'var(--accent-gold-dark)'} />
              {visit.signatures?.consultantImg || visit.signatures?.storeImg ? 'Assinado Digitalmente ✍️' : 'Coletar Assinaturas ✍️'}
            </button>

            {/* Native Share button if supported */}
            {typeof navigator !== 'undefined' && navigator.canShare && (
              <button 
                type="button"
                className="btn-primary"
                onClick={handleNativeShareFile}
                style={{ backgroundColor: '#0284C7', borderColor: '#0284C7', fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                title="Compartilhar arquivo PDF direto (Windows / Celular)"
                disabled={isGeneratingPdf}
              >
                <Share2 size={15} /> Compartilhar Arquivo PDF
              </button>
            )}

            <button 
              type="button"
              className="btn-primary" 
              onClick={() => handleOpenShareModal('whatsapp')}
              style={{ backgroundColor: '#25D366', borderColor: '#25D366', color: '#FFFFFF', fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
              title="Gerar PDF e enviar pelo WhatsApp"
              disabled={isGeneratingPdf}
            >
              <MessageSquare size={15} /> WhatsApp
            </button>

            <button 
              type="button"
              className="btn-primary" 
              onClick={() => handleOpenShareModal('email')}
              style={{ backgroundColor: '#1E40AF', borderColor: '#1E40AF', color: '#FFFFFF', fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
              title="Gerar PDF e enviar por E-mail"
              disabled={isGeneratingPdf}
            >
              <Mail size={15} /> E-mail
            </button>

            <button 
              type="button"
              className="btn-primary" 
              onClick={() => handleOpenShareModal('both')}
              style={{ backgroundColor: 'var(--primary-brown)', fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
              title="Gerar PDF e disparar por WhatsApp + E-mail"
              disabled={isGeneratingPdf}
            >
              <Send size={15} /> Ambos
            </button>

            <button 
              type="button"
              className="btn-secondary" 
              onClick={generateAndDownloadPDF}
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              title="Baixar arquivo PDF diretamente"
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} color="var(--primary-brown)" />}
              {isGeneratingPdf ? 'Gerando...' : 'Baixar PDF'}
            </button>

            <button 
              type="button"
              className="btn-secondary" 
              onClick={() => window.print()}
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.8rem' }}
              title="Imprimir laudo"
            >
              <Printer size={15} /> Imprimir
            </button>

            <button 
              type="button"
              className="btn-secondary" 
              onClick={() => startEditVisit(visit)}
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              title="Editar este relatório e planos de ação"
            >
              <Edit3 size={15} color="var(--primary-brown)" /> Editar Laudo
            </button>

            <button 
              type="button"
              className="btn-secondary" 
              onClick={() => {
                if (confirm(`Tem certeza que deseja excluir permanentemente este relatório da unidade "${store?.name}" realizado em ${new Date(visit.date + 'T12:00:00').toLocaleDateString('pt-BR')}? Esta ação não pode ser desfeita.`)) {
                  deleteVisit(visit.id);
                }
              }}
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.65rem', color: '#991B1B', borderColor: '#FECACA' }}
              title="Excluir este relatório"
            >
              <Trash2 size={15} />
            </button>

            <button 
              type="button"
              className="btn-secondary" 
              onClick={() => setSelectedVisitForReport(null)}
              style={{ padding: '0.45rem 0.6rem' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Guia Visual de Como Anexar no WhatsApp (após o download do PDF) */}
        {showAttachGuide && (
          <div className="no-print" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <Info size={18} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.83rem', color: '#1E3A8A', lineHeight: '1.4' }}>
                <strong>Arquivo PDF baixado para o seu computador!</strong><br />
                O WhatsApp foi aberto. Como os navegadores não podem injetar arquivos locais sozinhos por segurança, basta <strong>arrastar o PDF baixado para a conversa</strong> ou clicar no ícone de <strong>📎 clipe de papel &gt; Documento</strong> no WhatsApp para enviar o PDF.
              </div>
            </div>
            <button type="button" onClick={() => setShowAttachGuide(false)} style={{ color: '#60A5FA', padding: '2px' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* =========================================================================
            RELATÓRIO / PLANO DE AÇÃO OFICIAL SPOLETO (ÁREA DE IMPRESSÃO & PDF)
            ========================================================================= */}
        <div ref={reportRef} style={{ background: '#FFFFFF', padding: '1rem', color: '#0F172A' }}>
          
          {/* Header Corporativo Oficial Spoleto */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #5D3826', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <SpoletoRadarLogo variant="report" size="lg" />
            </div>

            <div style={{ textAlign: 'right' }}>
              <h1 className="report-title" style={{ fontSize: '1.35rem', margin: 0, color: '#5D3826' }}>
                PLANO DE AÇÃO OFICIAL
              </h1>
              <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, marginTop: '0.15rem' }}>
                CONSULTORIA DE NEGÓCIOS 360 &bull; REDE SPOLETO
              </div>
            </div>
          </div>

          {/* Store & Visit Metadata Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', background: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            <div>
              <div style={{ color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Unidade Spoleto Auditada</div>
              <strong style={{ fontSize: '1.05rem', color: '#0F172A' }}>{store?.name}</strong>
              <div style={{ color: '#475569', fontSize: '0.8rem', marginTop: '0.15rem' }}>
                Código RP: <strong>{store?.code}</strong> &bull; {store?.city}/{store?.state} &bull; {store?.locationType}
              </div>
            </div>

            <div>
              <div style={{ color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Dados da Consultoria</div>
              <div>
                Consultor(a):{' '}
                {consultant ? (
                  <strong 
                    onClick={() => setSelectedStaffForProfile(consultant)}
                    style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--primary-brown)' }}
                    title="Ver Ficha do Colaborador"
                  >
                    {consultant.name}
                  </strong>
                ) : (
                  <strong>Não atribuído</strong>
                )}{' '}
                ({consultant?.region || 'Nacional'})
              </div>
              <div>
                Data da Visita: <strong>{new Date(visit.date + 'T12:00:00').toLocaleDateString('pt-BR')}</strong> &bull; Horário: <strong>{visit.time ? (visit.endTime ? `${visit.time} às ${visit.endTime}` : `${visit.time}`) : '14:00'}</strong>
              </div>
              <div style={{ marginTop: '0.2rem' }}>
                Tipo de Visita: <strong style={{ color: visit.visitType === 'Visita surpresa' ? 'var(--primary-brown)' : '#0F172A' }}>{visit.visitType || 'Visita agendada'}</strong>
              </div>
            </div>
          </div>

          {/* Tabela de Plano de Ação Oficial Spoleto */}
          <div style={{ marginBottom: '2rem' }}>
            {visit.diagnostics.length === 0 ? (
              <div style={{ padding: '1.5rem', background: 'var(--success-light)', border: '1px solid var(--success)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--success)' }}>
                <CheckCircle2 size={24} style={{ margin: '0 auto 0.4rem' }} />
                <strong>Parabéns! Nenhuma não-conformidade identificada nesta visita.</strong>
              </div>
            ) : (
              <div className="table-responsive" style={{ border: '1px solid #5D3826', borderRadius: '4px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#5D3826', color: '#FFFFFF', textAlign: 'center' }}>
                      <th style={{ padding: '0.6rem 0.5rem', borderRight: '1px solid #7E5038', width: '70px' }}>Data</th>
                      <th style={{ padding: '0.6rem 0.5rem', borderRight: '1px solid #7E5038', width: '130px' }}>Tema / Causa</th>
                      <th style={{ padding: '0.6rem 0.75rem', borderRight: '1px solid #7E5038' }}>Ação</th>
                      <th style={{ padding: '0.6rem 0.5rem', borderRight: '1px solid #7E5038', width: '110px' }}>Quem</th>
                      <th style={{ padding: '0.6rem 0.5rem', borderRight: '1px solid #7E5038', width: '110px' }}>Status</th>
                      <th style={{ padding: '0.6rem 0.5rem', borderRight: '1px solid #7E5038', width: '85px' }}>Prazo</th>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visit.diagnostics.map((diag, idx) => {
                      const cat = categories.find(c => c.id === diag.categoryId);
                      const sub = cat?.subproblems.find(s => s.id === diag.subproblemId);

                      const status = diag.actionPlan?.status || 'NÃO INICIADO';
                      let statusBg = '#FEE2E2'; // red for NÃO INICIADO
                      let statusColor = '#B91C1C';
                      if (status === 'EM ANDAMENTO') {
                        statusBg = '#FEF08A'; // yellow
                        statusColor = '#854D0E';
                      } else if (status === 'CONCLUÍDO') {
                        statusBg = '#DCFCE7'; // green
                        statusColor = '#15803D';
                      }

                      return (
                        <tr key={diag.id} style={{ borderBottom: '1px solid #CBD5E1', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                          <td style={{ padding: '0.65rem 0.5rem', borderRight: '1px solid #CBD5E1', textAlign: 'center', fontWeight: 600 }}>
                            {new Date(visit.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </td>

                          <td style={{ padding: '0.65rem 0.5rem', borderRight: '1px solid #CBD5E1', textAlign: 'center', fontWeight: 700, textTransform: 'uppercase', color: '#0F172A', fontSize: '0.78rem' }}>
                            {cat?.name.split('(')[0].trim() || 'GERAL'}
                          </td>

                          <td style={{ padding: '0.65rem 0.75rem', borderRight: '1px solid #CBD5E1', color: '#1E293B', lineHeight: '1.35' }}>
                            {diag.actionPlan?.action}
                          </td>

                          <td style={{ padding: '0.65rem 0.5rem', borderRight: '1px solid #CBD5E1', textAlign: 'center', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                            {diag.actionPlan?.responsible || 'GERENTE'}
                          </td>

                          <td style={{ padding: '0.65rem 0.5rem', borderRight: '1px solid #CBD5E1', textAlign: 'center', background: statusBg, color: statusColor, fontWeight: 700, fontSize: '0.75rem' }}>
                            {status}
                          </td>

                          <td style={{ padding: '0.65rem 0.5rem', borderRight: '1px solid #CBD5E1', textAlign: 'center', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                            {diag.actionPlan?.deadline || 'IMEDIATO'}
                          </td>

                          <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.78rem', color: '#475569', fontStyle: 'italic', lineHeight: '1.3' }}>
                            <div>{diag.notes || sub?.title || 'Conforme combinamos em visita técnica.'}</div>
                            {diag.photoUrl && (
                              <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <img 
                                  src={diag.photoUrl} 
                                  alt="Evidência" 
                                  onClick={() => setZoomedPhoto(diag.photoUrl)}
                                  style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #94A3B8', cursor: 'pointer' }}
                                  title="Clique para ampliar a foto"
                                />
                                <span style={{ fontSize: '0.7rem', color: '#5D3826', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                  <Camera size={11} color="var(--accent-gold-dark)" /> Foto Anexada
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Galeria de Evidências Fotográficas de Não Conformidade */}
          {visit.diagnostics?.some(d => d.photoUrl) && (
            <div style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#5D3826', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.35rem' }}>
                <Camera size={16} color="var(--accent-gold-dark)" /> Registro Fotográfico de Não Conformidades (Evidências de Campo)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {visit.diagnostics.filter(d => d.photoUrl).map((d, pIdx) => {
                  const cat = categories.find(c => c.id === d.categoryId);
                  const sub = cat?.subproblems.find(s => s.id === d.subproblemId);
                  return (
                    <div 
                      key={d.id || pIdx} 
                      style={{
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        background: '#FFFFFF',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}
                    >
                      <img 
                        src={d.photoUrl} 
                        alt={`Evidência ${pIdx + 1}`}
                        onClick={() => setZoomedPhoto(d.photoUrl)}
                        style={{ width: '100%', height: '140px', objectFit: 'cover', cursor: 'pointer', borderBottom: '1px solid #CBD5E1' }}
                        title="Clique para ampliar"
                      />
                      <div style={{ padding: '0.5rem' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#C8102E', textTransform: 'uppercase' }}>
                          {cat?.name.split('(')[0].trim() || 'TÓPICO'}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#1E293B', fontWeight: 600, marginTop: '0.15rem', lineHeight: '1.2' }}>
                          {sub?.title || d.notes || 'Registro em visita'}
                        </div>
                        {d.notes && d.notes !== sub?.title && (
                          <div style={{ fontSize: '0.7rem', color: '#64748B', fontStyle: 'italic', marginTop: '0.2rem' }}>
                            "{d.notes}"
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Diagnóstico do Consultor */}
          {visit.generalNotes && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.35rem', color: '#5D3826', textTransform: 'uppercase' }}>
                Diagnóstico Geral do Consultor
              </h3>
              <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: '#334155', fontStyle: 'italic' }}>
                "{visit.generalNotes}"
              </div>
            </div>
          )}

          {/* Assinaturas Oficiais com Suporte a Assinatura Digital */}
          <div style={{ marginTop: '2.5rem', paddingTop: '1.25rem', borderTop: '1px solid #94A3B8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#5D3826', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Validação e Assinaturas do Laudo
              </span>
              
              {visit.signatures?.signedAt ? (
                <div style={{ fontSize: '0.72rem', color: '#166534', background: '#DCFCE7', border: '1px solid #86EFAC', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
                  <ShieldCheck size={13} color="#16A34A" /> Assinado em {new Date(visit.signatures.signedAt).toLocaleDateString('pt-BR')} às {new Date(visit.signatures.signedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              ) : (
                <button
                  type="button"
                  className="no-print btn-secondary"
                  onClick={() => setIsSignatureModalOpen(true)}
                  style={{ fontSize: '0.74rem', padding: '0.25rem 0.6rem', color: 'var(--primary-brown)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <PenTool size={12} /> Assinar com o dedo / mouse
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4rem' }}>
              {/* Assinatura do Consultor */}
              <div 
                style={{ textAlign: 'center', cursor: 'pointer' }}
                onClick={() => setIsSignatureModalOpen(true)}
                title="Clique para assinar ou editar assinatura do consultor"
              >
                <div style={{ height: '55px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '0.25rem' }}>
                  {visit.signatures?.consultantImg ? (
                    <img 
                      src={visit.signatures.consultantImg} 
                      alt="Assinatura do Consultor" 
                      style={{ maxHeight: '50px', maxWidth: '220px', objectFit: 'contain' }} 
                    />
                  ) : (
                    <span className="no-print" style={{ fontSize: '0.72rem', color: '#94A3B8', border: '1px dashed #CBD5E1', padding: '0.3rem 0.75rem', borderRadius: '4px' }}>
                      ✍️ Toque para assinar
                    </span>
                  )}
                </div>
                <div style={{ borderBottom: '1px solid #000', marginBottom: '0.4rem' }} />
                <strong style={{ fontSize: '0.82rem', display: 'block' }}>
                  {visit.signatures?.consultantName || consultant?.name || 'Consultor(a) de Negócios'}
                </strong>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Consultor(a) de Negócios Spoleto</span>
              </div>

              {/* Assinatura da Gerência / Franqueado */}
              <div 
                style={{ textAlign: 'center', cursor: 'pointer' }}
                onClick={() => setIsSignatureModalOpen(true)}
                title="Clique para assinar ou editar assinatura do responsável da loja"
              >
                <div style={{ height: '55px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '0.25rem' }}>
                  {visit.signatures?.storeImg ? (
                    <img 
                      src={visit.signatures.storeImg} 
                      alt="Assinatura da Gerência" 
                      style={{ maxHeight: '50px', maxWidth: '220px', objectFit: 'contain' }} 
                    />
                  ) : (
                    <span className="no-print" style={{ fontSize: '0.72rem', color: '#94A3B8', border: '1px dashed #CBD5E1', padding: '0.3rem 0.75rem', borderRadius: '4px' }}>
                      ✍️ Toque para assinar
                    </span>
                  )}
                </div>
                <div style={{ borderBottom: '1px solid #000', marginBottom: '0.4rem' }} />
                <strong style={{ fontSize: '0.82rem', display: 'block' }}>
                  {visit.signatures?.storeSignerName || 'Gerência da Loja'}
                </strong>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Responsável pela Unidade Spoleto</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL DE DISPARO DO PDF (WHATSAPP / E-MAIL / AMBOS)
          ========================================================================= */}
      {isShareModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setIsShareModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileDown size={20} color="var(--primary-brown)" />
                Gerar & Enviar PDF do Plano de Ação
              </h3>
              <button onClick={() => setIsShareModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Aviso explicativo */}
            <div style={{ background: '#FAF8F5', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem', fontSize: '0.83rem', color: 'var(--text-main)' }}>
              <strong>Como funciona:</strong> Ao confirmar, o sistema baixa o <strong>arquivo PDF oficial</strong> para o seu dispositivo e abre o WhatsApp com a mensagem pronta para anexar o PDF.
            </div>

            {/* Seletor de Canal */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setShareChannel('whatsapp')}
                style={{
                  flex: 1,
                  padding: '0.65rem 0.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: shareChannel === 'whatsapp' ? '2px solid #25D366' : '1px solid var(--border-subtle)',
                  background: shareChannel === 'whatsapp' ? '#DCFCE7' : '#FFFFFF',
                  color: shareChannel === 'whatsapp' ? '#15803D' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <MessageSquare size={16} /> WhatsApp
              </button>

              <button
                type="button"
                onClick={() => setShareChannel('email')}
                style={{
                  flex: 1,
                  padding: '0.65rem 0.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: shareChannel === 'email' ? '2px solid #1E40AF' : '1px solid var(--border-subtle)',
                  background: shareChannel === 'email' ? '#DBEAFE' : '#FFFFFF',
                  color: shareChannel === 'email' ? '#1E40AF' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <Mail size={16} /> E-mail
              </button>

              <button
                type="button"
                onClick={() => setShareChannel('both')}
                style={{
                  flex: 1,
                  padding: '0.65rem 0.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: shareChannel === 'both' ? '2px solid var(--primary-brown)' : '1px solid var(--border-subtle)',
                  background: shareChannel === 'both' ? 'var(--primary-red-light)' : '#FFFFFF',
                  color: shareChannel === 'both' ? 'var(--primary-brown)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <Send size={16} /> Ambos
              </button>
            </div>

            {/* Campos de Destinatário */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {(shareChannel === 'whatsapp' || shareChannel === 'both') && (
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MessageSquare size={14} color="#25D366" /> WhatsApp da Loja / Gerente
                  </label>
                  <input 
                    type="text"
                    placeholder="Ex: (11) 98765-4321 ou deixe em branco para escolher no WhatsApp"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                  />
                </div>
              )}

              {(shareChannel === 'email' || shareChannel === 'both') && (
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Mail size={14} color="#1E40AF" /> E-mail da Loja / Gerência
                  </label>
                  <input 
                    type="email"
                    placeholder="gerencia@spoleto.com.br"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsShareModalOpen(false)}>
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={handleExecuteSend}
                disabled={isGeneratingPdf}
                style={{
                  backgroundColor: shareChannel === 'whatsapp' ? '#25D366' : shareChannel === 'email' ? '#1E40AF' : 'var(--primary-brown)',
                  borderColor: shareChannel === 'whatsapp' ? '#25D366' : shareChannel === 'email' ? '#1E40AF' : 'var(--primary-brown)'
                }}
              >
                {isGeneratingPdf ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {isGeneratingPdf ? 'Gerando PDF...' : shareChannel === 'whatsapp' ? 'Gerar PDF & Abrir WhatsApp' : shareChannel === 'email' ? 'Gerar PDF & Abrir E-mail' : 'Gerar PDF & Abrir Ambos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE COLETA DE ASSINATURAS DIGITAIS
          ========================================================================= */}
      <DigitalSignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        visit={visit}
        consultant={consultant}
        store={store}
        onSave={(newSignatures) => {
          updateVisit(visit.id, {
            signatures: newSignatures
          });
        }}
      />

      {/* Lightbox Modal de Ampliação de Foto */}
      {zoomedPhoto && (
        <div 
          className="modal-overlay no-print" 
          onClick={() => setZoomedPhoto(null)} 
          style={{ zIndex: 9999, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)' }}
        >
          <div 
            className="modal-card" 
            style={{ maxWidth: '850px', padding: '1rem', background: '#1E293B', border: '1px solid #334155', textAlign: 'center' }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#F8FAFC', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Camera size={16} color="var(--accent-gold)" /> Evidência Fotográfica da Visita
              </span>
              <button 
                type="button" 
                onClick={() => setZoomedPhoto(null)} 
                style={{ color: '#94A3B8', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
              >
                <X size={22} />
              </button>
            </div>
            <img 
              src={zoomedPhoto} 
              alt="Evidência Ampliada" 
              style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
