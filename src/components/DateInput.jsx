import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';

/**
 * DateInput Component
 * Garante a exibição e digitação da data no padrão brasileiro (DD/MM/AAAA),
 * independente da linguagem do navegador/sistema operacional.
 * 
 * Props:
 * - value: string no formato ISO 'YYYY-MM-DD' ou ''
 * - onChange: função que recebe a string no formato ISO 'YYYY-MM-DD' ou ''
 * - required?: boolean
 * - disabled?: boolean
 * - placeholder?: string (default: 'DD/MM/AAAA')
 * - className?: string
 * - style?: React.CSSProperties
 */
export default function DateInput({
  value = '',
  onChange,
  required = false,
  disabled = false,
  placeholder = 'DD/MM/AAAA',
  className = '',
  style = {},
  ...rest
}) {
  const hiddenDateRef = useRef(null);

  // Converte YYYY-MM-DD para DD/MM/AAAA
  const isoToBr = (isoStr) => {
    if (!isoStr || typeof isoStr !== 'string') return '';
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      if (year && month && day) {
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      }
    }
    return '';
  };

  // Converte DD/MM/AAAA para YYYY-MM-DD (apenas se for data válida)
  const brToIso = (brStr) => {
    if (!brStr || typeof brStr !== 'string') return '';
    const clean = brStr.replace(/\D/g, '');
    if (clean.length === 8) {
      const day = parseInt(clean.slice(0, 2), 10);
      const month = parseInt(clean.slice(2, 4), 10);
      const year = parseInt(clean.slice(4, 8), 10);

      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
        const dStr = String(day).padStart(2, '0');
        const mStr = String(month).padStart(2, '0');
        const yStr = String(year);
        return `${yStr}-${mStr}-${dStr}`;
      }
    }
    return '';
  };

  const [displayText, setDisplayText] = useState(() => isoToBr(value));

  // Sincroniza displayText quando a prop value mudar externamente
  useEffect(() => {
    setDisplayText(isoToBr(value));
  }, [value]);

  // Formata a digitação com máscara DD/MM/AAAA
  const handleTextChange = (e) => {
    const raw = e.target.value;
    const digitsOnly = raw.replace(/\D/g, '').slice(0, 8);

    let formatted = '';
    if (digitsOnly.length > 0) {
      formatted = digitsOnly.slice(0, 2);
      if (digitsOnly.length >= 3) {
        formatted += '/' + digitsOnly.slice(2, 4);
      }
      if (digitsOnly.length >= 5) {
        formatted += '/' + digitsOnly.slice(4, 8);
      }
    }

    setDisplayText(formatted);

    if (formatted.length === 10) {
      const iso = brToIso(formatted);
      if (iso) {
        onChange?.(iso);
      }
    } else if (formatted.length === 0) {
      onChange?.('');
    }
  };

  // Quando o usuário escolhe uma data no picker nativo
  const handleNativePickerChange = (e) => {
    const newIso = e.target.value;
    if (newIso) {
      onChange?.(newIso);
      setDisplayText(isoToBr(newIso));
    }
  };

  // Abre o calendário do browser
  const openCalendar = () => {
    if (disabled) return;
    if (hiddenDateRef.current) {
      try {
        if (typeof hiddenDateRef.current.showPicker === 'function') {
          hiddenDateRef.current.showPicker();
        } else {
          hiddenDateRef.current.focus();
          hiddenDateRef.current.click();
        }
      } catch (err) {
        hiddenDateRef.current.focus();
        hiddenDateRef.current.click();
      }
    }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', ...style }}>
      {/* Input de texto visível com máscara brasileira DD/MM/AAAA */}
      <input
        type="text"
        value={displayText}
        onChange={handleTextChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        maxLength={10}
        inputMode="numeric"
        className={className}
        style={{
          width: '100%',
          paddingRight: '2.5rem', // espaço para o ícone do calendário
          fontVariantNumeric: 'tabular-nums'
        }}
        {...rest}
      />

      {/* Ícone de Calendário clicável */}
      <button
        type="button"
        onClick={openCalendar}
        disabled={disabled}
        tabIndex={-1}
        title="Abrir calendário"
        style={{
          position: 'absolute',
          right: '0.65rem',
          background: 'none',
          border: 'none',
          padding: '0.25rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary, #64748B)',
          borderRadius: '4px',
          transition: 'color 0.15s ease'
        }}
        onMouseEnter={(e) => {
          if (!disabled) e.currentTarget.style.color = 'var(--primary-brown, #5C1D06)';
        }}
        onMouseLeave={(e) => {
          if (!disabled) e.currentTarget.style.color = 'var(--text-secondary, #64748B)';
        }}
      >
        <Calendar size={18} />
      </button>

      {/* Input nativo invisível para disparar o seletor visual do calendário */}
      <input
        ref={hiddenDateRef}
        type="date"
        value={value || ''}
        onChange={handleNativePickerChange}
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: '0.65rem',
          bottom: '0',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
          border: 'none',
          padding: 0
        }}
      />
    </div>
  );
}
