import React from 'react';

/**
 * SpoletoRadarLogo Component
 * Logotipo Vetorial Oficial baseado na Identidade Visual do Spoleto:
 * - Tipografia geométrica "S P O L E T" em caixa alta com espaçamento largo
 * - O icônico "O" final com o recheio gema dourada (#F5A623) e a haste horizontal
 * - A assinatura integrada "RADAR" com indicador de consultoria operacional
 */
export default function SpoletoRadarLogo({ 
  variant = 'navbar', // 'navbar' (fundo escuro) | 'light' (fundo claro) | 'card' 
  size = 'md',        // 'sm' | 'md' | 'lg'
  showSubtitle = true
}) {
  const isDarkBg = variant === 'navbar';
  const textColor = isDarkBg ? '#FFFFFF' : '#2E1C13';
  const radarColor = '#F1A80A'; // Dourado Gema Oficial Spoleto
  const yolkColor = '#F5A623';
  const handleColor = isDarkBg ? '#FFFFFF' : '#2E1C13';

  // Dimension scaling
  const scale = size === 'sm' ? 0.75 : size === 'lg' ? 1.35 : 1;
  const baseHeight = 38 * scale;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: `${10 * scale}px`, cursor: 'pointer', userSelect: 'none' }}>
      <svg 
        height={baseHeight} 
        viewBox="0 0 360 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* Letras S P O L E T */}
        <text 
          x="0" 
          y="35" 
          fill={textColor} 
          fontFamily="'Montserrat', sans-serif" 
          fontWeight="800" 
          fontSize="36" 
          letterSpacing="7"
        >
          SPOLET
        </text>

        {/* Ícone Especial "O" do Spoleto (Prato / Frigideira com Gema Dourada + Cabo Horizontal) */}
        <g transform="translate(230, 22)">
          {/* Círculo Interno - Gema Amarela Dourada */}
          <circle cx="0" cy="0" r="14" fill={yolkColor} />

          {/* Anel Externo Preto/Branco */}
          <circle cx="0" cy="0" r="16.5" stroke={handleColor} strokeWidth="4.5" fill="none" />

          {/* Haste / Cabo Horizontal Direito (Marca Registrada Spoleto) */}
          <rect x="15" y="-2.5" width="16" height="5" rx="1.5" fill={handleColor} />

          {/* Ponto Central de Radar / Gema */}
          <circle cx="0" cy="0" r="2.5" fill="#FFFFFF" opacity="0.6" />
        </g>

        {/* Tagline / Badge "RADAR" */}
        {showSubtitle && (
          <g transform="translate(270, 7)">
            {/* Fundo do Badge Radar */}
            <rect 
              x="0" 
              y="0" 
              width="82" 
              height="33" 
              rx="4" 
              fill={isDarkBg ? 'rgba(241, 168, 10, 0.18)' : '#2E1C13'} 
              stroke={radarColor} 
              strokeWidth="1.5" 
            />
            {/* Texto RADAR */}
            <text 
              x="41" 
              y="22" 
              fill={isDarkBg ? '#F1A80A' : '#FFFFFF'} 
              fontFamily="'Montserrat', sans-serif" 
              fontWeight="900" 
              fontSize="14" 
              letterSpacing="3.5"
              textAnchor="middle"
            >
              RADAR
            </text>

            {/* Sinal / Ponto Ativo do Radar */}
            <circle cx="72" cy="9" r="3" fill="#10B981" />
            <circle cx="72" cy="9" r="5" stroke="#10B981" strokeWidth="1" opacity="0.6" />
          </g>
        )}
      </svg>
    </div>
  );
}
