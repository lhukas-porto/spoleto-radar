// src/components/ContractExpiryBadge.jsx
import React from 'react';
import { formatBrDate } from '../utils/dateHelpers';

/**
 * Badge visualizing the contract expiry status for a store.
 * - Green: > 90 days remaining
 * - Orange: 30-90 days remaining
 * - Red: <= 30 days or expired
 */
export default function ContractExpiryBadge({ expiryDate }) {
  if (!expiryDate) return null;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  let bgColor = '#10B981'; // green
  let textColor = '#FFFFFF';
  let label = 'Em dia';

  if (diffDays <= 0) {
    bgColor = '#EF4444'; // red
    label = 'Vencido';
  } else if (diffDays <= 30) {
    bgColor = '#F59E0B'; // orange
    label = `${diffDays}d`; // days left
  } else if (diffDays <= 90) {
    bgColor = '#FBBF24'; // amber
    label = `${diffDays}d`;
  }

  return (
    <span style={{
      background: bgColor,
      color: textColor,
      fontSize: '0.76rem',
      padding: '0.2rem 0.6rem',
      borderRadius: 'var(--radius-sm)',
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      gap: '0.35rem'
    }} title="Vencimento do Contrato de Franquia">
      {label}
    </span>
  );
}
