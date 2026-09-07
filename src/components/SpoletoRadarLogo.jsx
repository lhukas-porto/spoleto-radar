import React from 'react';
import { SPOLETO_LOGO_WHITE, SPOLETO_LOGO_DARK } from './spoletoLogoAssets';

/**
 * SpoletoRadarLogo Component
 * Utiliza diretamente a arte original e oficial do Spoleto enviada pelo franqueador:
 * - Mantém a proporção exata e milimétrica de todas as letras (S P O L E T O)
 * - O espaçamento idêntico (13px original) entre todas as letras, inclusive entre o T e a Frigideira (O)
 * - Versão branca para a navbar escura e versão escura para relatórios/fundos claros
 * - Badge executivo "RADAR" harmonizado na lateral
 */
export default function SpoletoRadarLogo({ 
  variant = 'navbar', // 'navbar' (fundo escuro) | 'light' | 'report' | 'card' 
  size = 'md',        // 'sm' | 'md' | 'lg'
  showSubtitle = true
}) {
  const isDarkBg = variant === 'navbar';
  const logoSrc = isDarkBg ? SPOLETO_LOGO_WHITE : SPOLETO_LOGO_DARK;
  const radarBorderColor = '#F1A80A'; // Dourado Gema Oficial Spoleto

  // Escala de dimensões mantendo proporção original exata (288 x 34)
  const scale = size === 'sm' ? 0.75 : size === 'lg' ? 1.25 : 1;
  const logoHeight = Math.round(25 * scale);
  const logoWidth = Math.round(logoHeight * (288 / 34)); // ~212px em md
  const badgeHeight = Math.round(24 * scale);

  return (
    <div 
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: `${10 * scale}px`, 
        cursor: 'pointer', 
        userSelect: 'none' 
      }}
    >
      {/* Imagem Original Vetorizada em Alta Resolução Retina */}
      <img 
        src={logoSrc} 
        alt="Spoleto" 
        style={{ 
          height: `${logoHeight}px`, 
          width: `${logoWidth}px`, 
          display: 'block', 
          objectFit: 'contain' 
        }} 
      />

      {/* Tagline / Badge "RADAR" Oficial */}
      {showSubtitle && (
        <div 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px',
            height: `${badgeHeight}px`,
            padding: `0 ${8 * scale}px`,
            borderRadius: '4px',
            backgroundColor: isDarkBg ? 'rgba(241, 168, 10, 0.18)' : '#2E1C13',
            border: `1.5px solid ${radarBorderColor}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }}
        >
          <span 
            style={{ 
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 900,
              fontSize: `${11 * scale}px`,
              letterSpacing: '2.5px',
              color: isDarkBg ? '#F1A80A' : '#FFFFFF',
              lineHeight: 1
            }}
          >
            RADAR
          </span>

          {/* Indicador Ativo do Radar */}
          <span 
            style={{ 
              width: `${6 * scale}px`, 
              height: `${6 * scale}px`, 
              borderRadius: '50%', 
              backgroundColor: '#10B981',
              boxShadow: '0 0 6px #10B981',
              display: 'inline-block'
            }} 
          />
        </div>
      )}
    </div>
  );
}
