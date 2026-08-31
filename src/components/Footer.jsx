import React from 'react';
import lfLogo from '../assets/lfcoding_logo.png';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      className="app-footer no-print" 
      style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-subtle, #E2E8F0)',
        backgroundColor: '#FFFFFF',
        padding: '1.25rem 1.5rem',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.02)'
      }}
    >
      <div 
        className="container"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: 0
        }}
      >
        {/* Lado Esquerdo: Info da Aplicação */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary-brown, #5D3826)', letterSpacing: '0.3px' }}>
            SPOLETO RADAR &bull; CONSULTORIA DE NEGÓCIOS 360
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #64748B)' }}>
            &copy; {currentYear} Rede de Franquias Spoleto. Todos os direitos reservados.
          </div>
        </div>

        {/* Lado Direito: Desenvolvido por LFcoding com Logo */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.65rem',
            background: 'var(--bg-warm, #FAF8F5)',
            padding: '0.4rem 0.85rem',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid #E8DFD8'
          }}
        >
          <span style={{ 
            fontSize: '0.75rem', 
            color: 'var(--text-secondary, #475569)', 
            fontWeight: 600,
            letterSpacing: '0.2px'
          }}>
            Desenvolvido por
          </span>
          <img 
            src={lfLogo} 
            alt="LFcoding" 
            style={{ 
              height: '28px', 
              width: 'auto', 
              objectFit: 'contain',
              display: 'block'
            }} 
            title="LFcoding"
          />
        </div>
      </div>
    </footer>
  );
}
