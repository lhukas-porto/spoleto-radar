import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCcw, Check, PenTool, Eraser } from 'lucide-react';

/**
 * SignaturePad Component
 * Canvas de alta precisão para coleta de assinatura manuscrita digital (Touch / Mouse / Caneta Stylus).
 * Suporta telas Retina / HiDPI, toque móvel e exporta PNG transparente sem apagar o traço.
 */
export default function SignaturePad({
  value = null,
  onChange,
  title = 'Assinatura Digital',
  subtitle = 'Desenhe sua assinatura com o dedo ou mouse no quadro abaixo',
  signerName = '',
  onSignerNameChange,
  signerNameLabel = 'Nome do Responsável',
  signerRole = '',
  height = 160,
  width = 460
}) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(Boolean(value));
  const internalDataRef = useRef(value);

  // Configura tamanho e escala do canvas
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const rect = canvas.getBoundingClientRect();
    const actualWidth = rect.width || width;
    const actualHeight = rect.height || height;

    // Salvar imagem atual se houver antes de redimensionar
    let savedData = null;
    if (canvas.width > 0 && canvas.height > 0) {
      try {
        savedData = canvas.toDataURL('image/png');
      } catch (e) {}
    }

    canvas.width = actualWidth * dpr;
    canvas.height = actualHeight * dpr;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1E293B'; // Tinta escura elegante
    ctx.lineWidth = 2.8;

    // Restaurar imagem
    const dataToRestore = savedData || internalDataRef.current || value;
    if (dataToRestore && dataToRestore.startsWith('data:image')) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.clearRect(0, 0, actualWidth, actualHeight);
        ctx.drawImage(img, 0, 0, actualWidth, actualHeight);
      };
      img.src = dataToRestore;
      setHasDrawn(true);
    }
  }, [width, height, value]);

  // Inicialização única no mount e no resize
  useEffect(() => {
    setupCanvas();
    const handleResize = () => setupCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Se o valor externo mudar externamente (ex: limpeza ou carregamento)
  useEffect(() => {
    if (value !== internalDataRef.current) {
      internalDataRef.current = value;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const actualWidth = canvas.width / dpr;
      const actualHeight = canvas.height / dpr;

      if (!value) {
        ctx.clearRect(0, 0, actualWidth, actualHeight);
        setHasDrawn(false);
      } else {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.clearRect(0, 0, actualWidth, actualHeight);
          ctx.drawImage(img, 0, 0, actualWidth, actualHeight);
          setHasDrawn(true);
        };
        img.src = value;
      }
    }
  }, [value]);

  // Helpers de coordenadas
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      e.target.setPointerCapture(e.pointerId);
    } catch (err) {}

    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
    setHasDrawn(true);
  };

  const handlePointerMove = (e) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    isDrawingRef.current = false;

    try {
      e.target.releasePointerCapture(e.pointerId);
    } catch (err) {}

    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      internalDataRef.current = dataUrl;
      onChange?.(dataUrl);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    isDrawingRef.current = false;
    setHasDrawn(false);
    internalDataRef.current = null;
    onChange?.(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.92rem', color: 'var(--primary-brown)' }}>
            <PenTool size={16} color="var(--accent-gold-dark)" /> {title}
          </div>
          {subtitle && (
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              {subtitle}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="btn-secondary"
          style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
          title="Limpar quadro para assinar novamente"
        >
          <RotateCcw size={13} /> Limpar
        </button>
      </div>

      {/* Campo Opcional de Nome do Assinante */}
      {onSignerNameChange && (
        <div style={{ marginBottom: '0.25rem' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
            {signerNameLabel}
          </label>
          <input
            type="text"
            value={signerName}
            onChange={(e) => onSignerNameChange(e.target.value)}
            placeholder="Ex: Carlos Eduardo (Gerente da Unidade)"
            style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
          />
        </div>
      )}

      {/* Canvas Pad */}
      <div 
        style={{
          position: 'relative',
          width: '100%',
          height: `${height}px`,
          backgroundColor: '#FAF8F5',
          border: '2px dashed #D6C7B8',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          touchAction: 'none',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)'
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            cursor: 'crosshair',
            touchAction: 'none'
          }}
        />

        {/* Guia de Assinatura */}
        <div 
          style={{
            position: 'absolute',
            bottom: '26px',
            left: '20px',
            right: '20px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.4)',
            pointerEvents: 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ✖ Assine acima desta linha
          </span>
          {signerRole && (
            <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600 }}>
              {signerRole}
            </span>
          )}
        </div>

        {!hasDrawn && !value && (
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -65%)',
              pointerEvents: 'none',
              textAlign: 'center',
              color: '#A0AEC0',
              fontSize: '0.82rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <PenTool size={20} style={{ opacity: 0.6 }} />
            <span>Toque e arraste para assinar</span>
          </div>
        )}
      </div>

      {hasDrawn && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', color: '#16A34A', fontWeight: 600 }}>
          <Check size={14} /> Assinatura capturada com sucesso!
        </div>
      )}
    </div>
  );
}
