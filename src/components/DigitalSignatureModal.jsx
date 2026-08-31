import React, { useState } from 'react';
import SignaturePad from './SignaturePad';
import { PenTool, CheckCircle2, X, ShieldCheck, User, Store } from 'lucide-react';

/**
 * DigitalSignatureModal Component
 * Modal interativo para coleta de assinaturas digitais do Consultor e do Franqueado/Gerente.
 */
export default function DigitalSignatureModal({
  isOpen,
  onClose,
  visit,
  consultant,
  store,
  onSave
}) {
  const initialSignatures = visit?.signatures || {};

  const [activeTab, setActiveTab] = useState('store'); // 'store' | 'consultant'
  const [consultantSig, setConsultantSig] = useState(initialSignatures.consultantImg || null);
  const [storeSig, setStoreSig] = useState(initialSignatures.storeImg || null);
  const [storeSignerName, setStoreSignerName] = useState(
    initialSignatures.storeSignerName || 'Gerência da Loja'
  );
  const [consultantName, setConsultantName] = useState(
    initialSignatures.consultantName || consultant?.name || 'Consultor(a) de Negócios'
  );

  if (!isOpen) return null;

  const handleConfirm = () => {
    const signaturesData = {
      consultantImg: consultantSig,
      consultantName: consultantName,
      storeImg: storeSig,
      storeSignerName: storeSignerName,
      signedAt: new Date().toISOString()
    };

    onSave(signaturesData);
    onClose();
  };

  const hasAnySignature = consultantSig || storeSig;

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={onClose}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '640px', width: '95%', padding: '1.75rem' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--primary-brown)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PenTool size={20} color="var(--accent-gold-dark)" />
              Coleta de Assinatura Digital do Laudo
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Unidade: <strong>{store?.name || 'Spoleto'}</strong> &bull; Data: {visit?.date}
            </p>
          </div>

          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs de Seleção de Quem está Assinando */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: '#F5F1EB', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('store')}
            style={{
              flex: 1,
              padding: '0.65rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'store' ? 800 : 600,
              backgroundColor: activeTab === 'store' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'store' ? 'var(--primary-brown)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'store' ? 'var(--shadow-sm)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Store size={16} /> 1. Gerente / Franqueado {storeSig ? '✅' : ''}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('consultant')}
            style={{
              flex: 1,
              padding: '0.65rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'consultant' ? 800 : 600,
              backgroundColor: activeTab === 'consultant' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'consultant' ? 'var(--primary-brown)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'consultant' ? 'var(--shadow-sm)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <User size={16} /> 2. Consultor(a) {consultantSig ? '✅' : ''}
          </button>
        </div>

        {/* Tab 1: Assinatura da Loja */}
        {activeTab === 'store' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <SignaturePad
              value={storeSig}
              onChange={setStoreSig}
              title="Assinatura da Gerência / Franqueado"
              subtitle="Passe o dispositivo para o responsável da loja rubricar com o dedo"
              signerName={storeSignerName}
              onSignerNameChange={setStoreSignerName}
              signerNameLabel="Nome de quem está recebendo a consultoria *"
              signerRole="Responsável pela Unidade Spoleto"
              height={170}
            />
          </div>
        )}

        {/* Tab 2: Assinatura do Consultor */}
        {activeTab === 'consultant' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <SignaturePad
              value={consultantSig}
              onChange={setConsultantSig}
              title="Assinatura do(a) Consultor(a) de Negócios"
              subtitle="Rubrica oficial do consultor técnico do Grupo Trigo"
              signerName={consultantName}
              onSignerNameChange={setConsultantName}
              signerNameLabel="Nome do(a) Consultor(a)"
              signerRole="Consultor(a) de Negócios • Grupo Trigo"
              height={170}
            />
          </div>
        )}

        {/* Aviso de Autenticidade */}
        <div style={{ marginTop: '1.25rem', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#166534' }}>
          <ShieldCheck size={18} color="#16A34A" />
          <span>
            Ao salvar, as assinaturas serão fixadas no Laudo Oficial e incluídas automaticamente no PDF exportado.
          </span>
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          
          <button 
            type="button" 
            className="btn-primary"
            onClick={handleConfirm}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <CheckCircle2 size={16} /> Salvar Assinaturas no Laudo
          </button>
        </div>
      </div>
    </div>
  );
}
