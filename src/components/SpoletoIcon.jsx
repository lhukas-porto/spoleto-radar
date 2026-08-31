import React from 'react';

/**
 * SpoletoIcon Component
 * Ícone Oficial da Marca Spoleto (Círculo com Gema Amarela Dourada e Haste Horizontal)
 */
export default function SpoletoIcon({ 
  size = 24, 
  strokeColor = '#1E1E1E', 
  yolkColor = '#FAB819', 
  className = '', 
  style = {} 
}) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      {/* Gema de Ovo Amarela Dourada */}
      <circle cx="42" cy="50" r="34" fill={yolkColor} />
      
      {/* Borda Circular Preta Grossa */}
      <circle cx="42" cy="50" r="34" stroke={strokeColor} strokeWidth="12" fill="none" />
      
      {/* Haste / Barra Horizontal Preta Oficial Spoleto */}
      <rect x="42" y="44" width="56" height="12" rx="2" fill={strokeColor} />
    </svg>
  );
}
