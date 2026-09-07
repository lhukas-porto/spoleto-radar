import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Search, 
  UploadCloud, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Presentation, 
  FileCheck2, 
  File, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  Filter, 
  Clock, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Tag
} from 'lucide-react';

export default function RepositoryModal({ isOpen, onClose }) {
  const { documents = [], addDocument, deleteDocument, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedFormat, setSelectedFormat] = useState('all'); // 'all' | 'xlsx' | 'docx' | 'pptx' | 'pdf'
  const [isUploading, setIsUploading] = useState(false);

  // Form de upload
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Financeiro & CMV');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const categoriesList = [
    'Todas',
    'Financeiro & CMV',
    'Operação & Cozinha',
    'Qualidade & Sanitário',
    'Delivery & iFood',
    'Pessoas & Treinamento',
    'Gestão & Negócios',
    'Planos de Ação'
  ];

  // Filtros
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'Todas' || doc.category === selectedCategory;
    const matchesFormat = selectedFormat === 'all' || doc.format.toLowerCase() === selectedFormat.toLowerCase();

    return matchesSearch && matchesCategory && matchesFormat;
  });

  // Helper de ícone e cores por formato
  const getFormatBadge = (fmt) => {
    const f = (fmt || '').toLowerCase();
    switch (f) {
      case 'xlsx':
      case 'xls':
      case 'csv':
        return {
          icon: <FileSpreadsheet size={20} color="#15803D" />,
          label: 'EXCEL',
          color: '#15803D',
          bg: '#DCFCE7',
          border: '#86EFAC'
        };
      case 'docx':
      case 'doc':
        return {
          icon: <FileText size={20} color="#1D4ED8" />,
          label: 'WORD',
          color: '#1D4ED8',
          bg: '#DBEAFE',
          border: '#93C5FD'
        };
      case 'pptx':
      case 'ppt':
        return {
          icon: <Presentation size={20} color="#C2410C" />,
          label: 'POWERPOINT',
          color: '#C2410C',
          bg: '#FFEDD5',
          border: '#FDBA74'
        };
      case 'pdf':
        return {
          icon: <FileCheck2 size={20} color="#B91C1C" />,
          label: 'PDF',
          color: '#B91C1C',
          bg: '#FEE2E2',
          border: '#FCA5A5'
        };
      default:
        return {
          icon: <File size={20} color="#6B7280" />,
          label: f.toUpperCase() || 'ARQUIVO',
          color: '#4B5563',
          bg: '#F3F4F6',
          border: '#E5E7EB'
        };
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      if (!uploadTitle) {
        // Sugere nome do arquivo limpo sem extensão
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setUploadTitle(nameWithoutExt);
      }
    }
  };

  const handleSaveUpload = (e) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      alert('Por favor, informe o título do modelo.');
      return;
    }

    let format = 'pdf';
    let fileSize = '1.2 MB';
    let fileContentUrl = null;

    if (uploadedFile) {
      const ext = uploadedFile.name.split('.').pop()?.toLowerCase() || 'pdf';
      format = ext;
      const sizeInMb = (uploadedFile.size / (1024 * 1024)).toFixed(1);
      fileSize = sizeInMb > 0 ? `${sizeInMb} MB` : `${Math.round(uploadedFile.size / 1024)} KB`;
      fileContentUrl = URL.createObjectURL(uploadedFile);
    }

    const newDoc = {
      id: `doc-${Date.now()}`,
      title: uploadTitle.trim(),
      category: uploadCategory,
      format,
      fileSize,
      version: 'v2026.1',
      updatedAt: new Date().toISOString().split('T')[0],
      downloads: 1,
      description: uploadDescription.trim() || 'Modelo disponibilizado para uso da equipe e franqueados Spoleto.',
      downloadUrl: fileContentUrl,
      author: 'Equipe de Consultoria',
      isOfficial: true
    };

    addDocument(newDoc);
    showToast('✅ Arquivo adicionado com sucesso ao Repositório Spoleto!');

    // Reset form
    setIsUploading(false);
    setUploadTitle('');
    setUploadDescription('');
    setUploadedFile(null);
  };

  const handleDownload = (doc) => {
    if (doc.downloadUrl) {
      const a = document.createElement('a');
      a.href = doc.downloadUrl;
      a.download = `${doc.title}.${doc.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Simulação elegante de download de template oficial gerando arquivo com dados institucionais
      const simulatedText = `========================================================\nSPOLETO - CONSULTORIA DE NEGÓCIOS & OPERAÇÕES\nMODELO OFICIAL: ${doc.title.toUpperCase()}\nVERSÃO: ${doc.version} | CATEGORIA: ${doc.category}\nAUTOR: ${doc.author}\n========================================================\n\nEste é o modelo padrão de trabalho homologado pela rede Spoleto.\nDescrição: ${doc.description}\n\nUtilize este modelo oficial nas rotinas operacionais e reuniões com franqueados.`;
      const blob = new Blob([simulatedText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title.replace(/\s+/g, '_')}_${doc.version}.${doc.format === 'xlsx' ? 'txt' : doc.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    showToast(`Baixando: ${doc.title}`);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xl)',
        width: '100%',
        maxWidth: '1020px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)'
      }}>
        {/* Modal Header */}
        <div style={{
          backgroundColor: 'var(--primary-brown)',
          color: '#FFFFFF',
          padding: '1.25rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '3px solid var(--accent-gold)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}>
              <UploadCloud size={22} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Repositório de Modelos & Ferramentas
                <span style={{ fontSize: '0.72rem', background: 'var(--accent-gold)', color: 'var(--primary-brown)', padding: '0.15rem 0.55rem', borderRadius: 'var(--radius-full)', fontWeight: 800 }}>
                  OFICIAL SPOLETO
                </span>
              </h2>
              <p style={{ fontSize: '0.8rem', opacity: 0.85, margin: '0.2rem 0 0' }}>
                Central unificada de planilhas Excel, apresentações PPT, manuais PDF e termos Word para consultores e franqueados.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setIsUploading(!isUploading)}
              className="btn-primary"
              style={{
                backgroundColor: isUploading ? 'rgba(255,255,255,0.2)' : 'var(--accent-gold)',
                color: isUploading ? '#FFFFFF' : 'var(--primary-brown)',
                borderColor: 'transparent',
                fontWeight: 700,
                fontSize: '0.82rem',
                padding: '0.45rem 0.9rem',
                gap: '0.4rem'
              }}
            >
              {isUploading ? <X size={15} /> : <Plus size={15} />}
              {isUploading ? 'Fechar Formulário' : 'Novo Arquivo'}
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                opacity: 0.85,
                padding: '0.4rem',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'opacity 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.85'}
              title="Fechar Repositório"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Formulário de Upload Retrátil */}
        {isUploading && (
          <form onSubmit={handleSaveUpload} style={{
            backgroundColor: '#FAF8F5',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '1.25rem 1.75rem',
            animation: 'fadeIn 0.2s ease'
          }}>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--primary-brown)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UploadCloud size={16} /> Fazer Upload / Cadastrar Novo Modelo
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Título do Arquivo / Modelo *
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ex: Planilha de CMV Diário e Pesagem"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Categoria *
                </label>
                <select
                  className="input-field"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                >
                  {categoriesList.filter(c => c !== 'Todas').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Selecionar Arquivo (Word, Excel, PPT, PDF)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.doc,.docx,.ppt,.pptx,.pdf,.csv"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '0.55rem', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <UploadCloud size={15} />
                  {uploadedFile ? uploadedFile.name : 'Escolher no Computador'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Descrição / Orientações de Uso
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Ex: Utilizar nas visitas mensais de consultoria financeira para apurar o CMV real da loja."
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsUploading(false)}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 1.1rem' }}
              >
                Salvar Modelo no Repositório
              </button>
            </div>
          </form>
        )}

        {/* Barra de Busca e Filtros */}
        <div style={{
          padding: '1rem 1.75rem',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Campo de Busca */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Buscar por nome, categoria ou palavra-chave..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.35rem', fontSize: '0.85rem' }}
            />
          </div>

          {/* Filtros de Formato */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'xlsx', label: 'Excel' },
              { id: 'docx', label: 'Word' },
              { id: 'pptx', label: 'PPT' },
              { id: 'pdf', label: 'PDF' }
            ].map(fmt => (
              <button
                key={fmt.id}
                onClick={() => setSelectedFormat(fmt.id)}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: selectedFormat === fmt.id ? '1px solid var(--primary-brown)' : '1px solid var(--border-subtle)',
                  backgroundColor: selectedFormat === fmt.id ? 'var(--primary-brown)' : '#FFFFFF',
                  color: selectedFormat === fmt.id ? '#FFFFFF' : 'var(--text-main)',
                  fontWeight: selectedFormat === fmt.id ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {fmt.label}
              </button>
            ))}
          </div>

          {/* Seletor de Categorias */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={14} color="var(--text-muted)" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                fontSize: '0.8rem',
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: '#FAFAFA',
                color: 'var(--text-main)',
                fontWeight: 600
              }}
            >
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de Documentos */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem 1.75rem',
          backgroundColor: '#F8F9FA',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
          gap: '1.25rem',
          alignContent: 'start'
        }}>
          {filteredDocuments.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              padding: '4rem 1rem',
              textAlign: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-subtle)'
            }}>
              <File size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>Nenhum modelo encontrado</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
                Tente ajustar os termos de busca ou clique em "Novo Arquivo" para adicionar um novo modelo oficial à biblioteca.
              </p>
            </div>
          ) : (
            filteredDocuments.map(doc => {
              const badge = getFormatBadge(doc.format);

              return (
                <div
                  key={doc.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '1.15rem',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = 'var(--primary-brown)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.03)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  <div>
                    {/* Topo do Card: Formato & Categoria */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          backgroundColor: badge.bg,
                          border: `1px solid ${badge.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {badge.icon}
                        </div>
                        <div>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            color: badge.color,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase'
                          }}>
                            {badge.label} &bull; {doc.fileSize}
                          </span>
                          <span style={{
                            display: 'block',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: 'var(--text-muted)'
                          }}>
                            {doc.category}
                          </span>
                        </div>
                      </div>

                      {doc.isOfficial && (
                        <span style={{
                          fontSize: '0.65rem',
                          background: '#FEF3C7',
                          color: '#B45309',
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem'
                        }} title="Homologado pela equipe oficial Spoleto">
                          <ShieldCheck size={11} /> Oficial
                        </span>
                      )}
                    </div>

                    {/* Título & Descrição */}
                    <h4 style={{
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      lineHeight: '1.3',
                      marginBottom: '0.45rem'
                    }}>
                      {doc.title}
                    </h4>

                    <p style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      marginBottom: '0.85rem'
                    }}>
                      {doc.description}
                    </p>
                  </div>

                  {/* Rodapé do Card: Metadados & Botão de Download */}
                  <div style={{
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <div>Versão: <strong>{doc.version}</strong></div>
                      <div>Atualizado: {doc.updatedAt}</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="btn-primary"
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.35rem 0.75rem',
                          backgroundColor: 'var(--primary-brown)',
                          gap: '0.35rem'
                        }}
                        title={`Baixar ${doc.title}`}
                      >
                        <Download size={13} /> Baixar
                      </button>

                      {/* Exclusão opcional de modelos criados localmente */}
                      {doc.id.startsWith('doc-') && !['doc-cmv-calc', 'doc-reuniao-franqueado', 'doc-manual-qa', 'doc-ata-alinhamento', 'doc-delivery-guia', 'doc-escala-equipe'].includes(doc.id) && (
                        <button
                          onClick={() => {
                            if (confirm(`Excluir o modelo "${doc.title}" do repositório?`)) {
                              deleteDocument(doc.id);
                            }
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            padding: '0.35rem',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '4px'
                          }}
                          title="Excluir arquivo"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '0.85rem 1.75rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Exibindo <strong>{filteredDocuments.length}</strong> de <strong>{documents.length}</strong> modelos disponíveis.
          </span>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.95rem' }}
          >
            Fechar Repositório
          </button>
        </div>
      </div>
    </div>
  );
}
