import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Check, 
  X, 
  Move, 
  Camera, 
  Sliders 
} from 'lucide-react';

/**
 * AvatarCropModal: Modal interativo para posicionar, arrastar e dar zoom na foto dentro de um círculo oficial Spoleto
 */
export default function AvatarCropModal({ imageSrc, onConfirm, onCancel }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [previewUrl, setPreviewUrl] = useState(null);

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  const CROP_SIZE = 220; // Diâmetro do círculo de corte em px

  // Carrega a imagem e inicializa posição centralizada
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
      // Calcular escala inicial para preencher o círculo
      const minDimension = Math.min(img.width, img.height);
      const initialScale = Math.max(CROP_SIZE / minDimension, 1);
      setScale(initialScale);
      setPosition({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Handler para iniciar o arrasto (Mouse & Touch)
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  // Handler para mover durante o arrasto
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleEndDrag = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEndDrag);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEndDrag);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEndDrag);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEndDrag);
    };
  }, [isDragging, handleMouseMove, handleTouchMove]);

  // Zoom via roda do mouse
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.1 : -0.1;
    setScale(prev => Math.min(Math.max(prev + zoomFactor, 0.5), 4));
  };

  // Resetar posição e zoom
  const handleReset = () => {
    const minDimension = Math.min(imageSize.width, imageSize.height);
    const initialScale = minDimension > 0 ? Math.max(CROP_SIZE / minDimension, 1) : 1;
    setScale(initialScale);
    setPosition({ x: 0, y: 0 });
  };

  // Gerar o corte circular final em alta resolução (400x400)
  const handleConfirmCrop = () => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    const outputCanvas = document.createElement('canvas');
    const OUTPUT_SIZE = 400; // Resolução final do avatar
    outputCanvas.width = OUTPUT_SIZE;
    outputCanvas.height = OUTPUT_SIZE;
    const ctx = outputCanvas.getContext('2d');

    // Fundo transparente com corte circular
    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Relação de proporção entre o viewport do modal e o canvas final
    const ratio = OUTPUT_SIZE / CROP_SIZE;

    // Dimensões renderizadas no modal
    const renderedWidth = imageSize.width * scale;
    const renderedHeight = imageSize.height * scale;

    // Centro do círculo no modal = (CROP_SIZE / 2, CROP_SIZE / 2)
    // Posição do canto superior esquerdo da imagem em relação ao centro do círculo:
    const drawX = (CROP_SIZE / 2 - renderedWidth / 2 + position.x) * ratio;
    const drawY = (CROP_SIZE / 2 - renderedHeight / 2 + position.y) * ratio;
    const drawWidth = renderedWidth * ratio;
    const drawHeight = renderedHeight * ratio;

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    const croppedDataUrl = outputCanvas.toDataURL('image/jpeg', 0.9);
    onConfirm(croppedDataUrl);
  };

  if (!imageSrc) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 10060 }} onClick={onCancel}>
      <div 
        className="modal-card" 
        style={{ 
          maxWidth: '520px', 
          padding: '1.75rem', 
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ marginBottom: '1rem', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Camera size={20} color="var(--primary-brown)" />
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--primary-brown)', fontWeight: 800 }}>
              Ajustar Foto do Membro
            </h3>
          </div>
          <button className="modal-close" onClick={onCancel} title="Fechar">
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', marginTop: 0 }}>
          Arraste a foto com o mouse para posicionar o rosto e use a barra de zoom para aproximar.
        </p>

        {/* Viewport de Corte com Máscara Circular */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div 
            ref={containerRef}
            onWheel={handleWheel}
            style={{
              position: 'relative',
              width: `${CROP_SIZE}px`,
              height: `${CROP_SIZE}px`,
              borderRadius: '50%',
              overflow: 'hidden',
              boxShadow: '0 0 0 6px var(--accent-gold), 0 10px 25px rgba(0,0,0,0.25)',
              backgroundColor: '#1E293B',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none'
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            title="Arraste para mover a foto"
          >
            {/* Imagem sendo posicionada */}
            <img 
              ref={imageRef}
              src={imageSrc} 
              alt="Ajuste de Avatar" 
              draggable={false}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: `${imageSize.width * scale}px`,
                height: `${imageSize.height * scale}px`,
                maxWidth: 'none',
                maxHeight: 'none',
                transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
                pointerEvents: 'none',
                transition: isDragging ? 'none' : 'transform 0.05s ease-out'
              }}
            />

            {/* Guia visual de enquadramento (grade central sutil) */}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px dashed rgba(255, 255, 255, 0.4)',
              pointerEvents: 'none'
            }} />

            {/* Dica de arrastar sobreposta */}
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.65)',
              color: '#FFFFFF',
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              whiteSpace: 'nowrap'
            }}>
              <Move size={10} /> Arraste para mover
            </div>
          </div>
        </div>

        {/* Controles de Zoom & Ajustes */}
        <div style={{ background: '#FAF8F5', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sliders size={14} color="var(--primary-brown)" /> Nível de Zoom
            </span>
            <span style={{ color: 'var(--primary-brown)', fontWeight: 800 }}>
              {Math.round(scale * 100)}%
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              type="button" 
              className="btn-secondary" 
              style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              onClick={() => setScale(prev => Math.max(prev - 0.15, 0.5))}
              title="Diminuir Zoom"
            >
              <ZoomOut size={15} />
            </button>

            <input 
              type="range" 
              min="0.5" 
              max="3.5" 
              step="0.05"
              value={scale} 
              onChange={(e) => setScale(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--primary-brown)', cursor: 'pointer', margin: 0 }}
            />

            <button 
              type="button" 
              className="btn-secondary" 
              style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              onClick={() => setScale(prev => Math.min(prev + 0.15, 3.5))}
              title="Aumentar Zoom"
            >
              <ZoomIn size={15} />
            </button>

            <button 
              type="button" 
              className="btn-secondary" 
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              onClick={handleReset}
              title="Resetar Posição e Zoom"
            >
              <RotateCcw size={13} /> Centralizar
            </button>
          </div>
        </div>

        {/* Ações do Modal */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <button type="button" className="btn-secondary" onClick={onCancel} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            Cancelar
          </button>
          <button type="button" className="btn-primary" onClick={handleConfirmCrop} style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem', gap: '0.4rem' }}>
            <Check size={16} /> Confirmar Enquadramento
          </button>
        </div>
      </div>
    </div>
  );
}
