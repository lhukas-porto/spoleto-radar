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
          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--primary-brown, #5D3826)', letterSpacing: '0.5px' }}>
            SPOLETO RADAR
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #64748B)' }}>
            &copy; {currentYear} Rede de Franquias Spoleto. Todos os direitos reservados.
          </div>
        </div>

        {/* Lado Direito: Desenvolvido por LFcoding com Link Direto para WhatsApp */}
        <a 
          href="https://wa.me/5561996272630?text=Ol%C3%A1!%20Vim%20pelo%20Spoleto%20Radar%20e%20gostaria%20de%20falar%20com%20a%20LFcoding."
          target="_blank"
          rel="noopener noreferrer"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.65rem',
            background: 'var(--bg-warm, #FAF8F5)',
            padding: '0.45rem 0.95rem',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid #E8DFD8',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-gold-dark, #8C6239)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(93, 56, 38, 0.1)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#E8DFD8';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          title="Falar com a LFcoding no WhatsApp (61 99627-2630)"
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
          />
        </a>
      </div>
    </footer>
  );
}
