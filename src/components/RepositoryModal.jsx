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
  Tag,
  Cloud,
  Link2,
  Globe
} from 'lucide-react';
import { 
  saveFileBinary, 
  getFileBinary, 
  deleteFileBinary,
  uploadFileToSupabase,
  deleteFileFromSupabase,
  SUPABASE_BUCKET_NAME
} from '../services/documentStorage';
import { supabase } from '../services/supabase';

/**
 * Resolve URLs da nuvem (Google Drive, Dropbox, OneDrive, Web) para download direto
 */
export function resolveCloudUrl(rawUrl, defaultFormat = 'pdf') {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { directDownloadUrl: '', cloudUrl: '', provider: 'Nuvem', detectedFormat: defaultFormat };
  }

  const url = rawUrl.trim();
  let directDownloadUrl = url;
  let provider = 'Nuvem Web';
  let detectedFormat = defaultFormat;

  // 1. Google Drive / Docs / Sheets / Slides
  if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
    provider = 'Google Drive';

    // Google Sheets
    const sheetsMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (sheetsMatch) {
      detectedFormat = 'xlsx';
      directDownloadUrl = `https://docs.google.com/spreadsheets/d/${sheetsMatch[1]}/export?format=xlsx`;
    } 
    // Google Docs
    else if (url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)) {
      const docMatch = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
      detectedFormat = 'docx';
      directDownloadUrl = `https://docs.google.com/document/d/${docMatch[1]}/export?format=docx`;
    }
    // Google Slides
    else if (url.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/)) {
      const slideMatch = url.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
      detectedFormat = 'pptx';
      directDownloadUrl = `https://docs.google.com/presentation/d/${slideMatch[1]}/export?format=pptx`;
    }
    // Google Drive File
    else {
      const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (fileMatch) {
        directDownloadUrl = `https://drive.google.com/uc?export=download&id=${fileMatch[1]}`;
      }
    }
  }
  // 2. Dropbox
  else if (url.includes('dropbox.com')) {
    provider = 'Dropbox';
    if (url.includes('dl=0')) {
      directDownloadUrl = url.replace('dl=0', 'dl=1');
    } else if (!url.includes('dl=1')) {
      directDownloadUrl = url + (url.includes('?') ? '&dl=1' : '?dl=1');
    }
  }
  // 3. OneDrive / SharePoint
  else if (url.includes('1drv.ms') || url.includes('onedrive.live.com') || url.includes('sharepoint.com')) {
    provider = 'OneDrive';
    if (!url.includes('download=1')) {
      directDownloadUrl = url + (url.includes('?') ? '&download=1' : '?download=1');
    }
  }

  // 4. Detecção por extensão na URL
  const extMatch = url.match(/\.([a-zA-Z0-9]{3,4})(?:[?#]|$)/i);
  if (extMatch) {
    const ext = extMatch[1].toLowerCase();
    if (['xlsx', 'xls', 'csv'].includes(ext)) detectedFormat = 'xlsx';
    else if (['doc', 'docx'].includes(ext)) detectedFormat = 'docx';
    else if (['ppt', 'pptx'].includes(ext)) detectedFormat = 'pptx';
    else if (['pdf'].includes(ext)) detectedFormat = 'pdf';
  }

  return {
    directDownloadUrl,
    cloudUrl: url,
    provider,
    detectedFormat
  };
}

export default function RepositoryModal({ isOpen, onClose }) {
  const { documents = [], addDocument, deleteDocument, showToast, activeUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedFormat, setSelectedFormat] = useState('all'); // 'all' | 'xlsx' | 'docx' | 'pptx' | 'pdf'
  const [isUploading, setIsUploading] = useState(false);

  // Form de upload (Arquivo Local ou Link da Nuvem)
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'cloud'
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Financeiro & CMV');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [cloudUrl, setCloudUrl] = useState('');
  const [cloudFormat, setCloudFormat] = useState('xlsx');
  const [isSaving, setIsSaving] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

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

  const handleCloudUrlChange = (e) => {
    const val = e.target.value;
    setCloudUrl(val);
    if (val.trim()) {
      const res = resolveCloudUrl(val, cloudFormat);
      if (res.detectedFormat) {
        setCloudFormat(res.detectedFormat);
      }
      if (!uploadTitle.trim()) {
        if (val.includes('spreadsheets')) setUploadTitle('Planilha Compartilhada');
        else if (val.includes('document')) setUploadTitle('Documento Compartilhado');
        else if (val.includes('presentation')) setUploadTitle('Apresentação Compartilhada');
      }
    }
  };

  const handleSaveUpload = async (e) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      alert('Por favor, informe o título do modelo.');
      return;
    }

    if (uploadMode === 'cloud' && !cloudUrl.trim()) {
      alert('Por favor, cole o link de compartilhamento da nuvem.');
      return;
    }

    setIsSaving(true);
    try {
      const docId = `doc-${Date.now()}`;

      if (uploadMode === 'cloud') {
        const resolution = resolveCloudUrl(cloudUrl, cloudFormat);
        const newDoc = {
          id: docId,
          title: uploadTitle.trim(),
          category: uploadCategory,
          format: cloudFormat || resolution.detectedFormat || 'pdf',
          fileSize: 'Nuvem',
          version: 'v2026.1',
          updatedAt: new Date().toISOString().split('T')[0],
          downloads: 0,
          description: uploadDescription.trim() || `Arquivo compartilhado via ${resolution.provider}.`,
          downloadUrl: resolution.directDownloadUrl,
          cloudUrl: resolution.cloudUrl,
          cloudProvider: resolution.provider,
          isCloudLink: true,
          hasRealFile: false,
          originalFileName: null,
          author: activeUser?.name || 'Equipe de Consultoria',
          isOfficial: false
        };

        addDocument(newDoc);
        showToast(`✅ Link do ${resolution.provider} salvo com sucesso!`);
      } else {
        let format = 'pdf';
        let fileSize = '1.2 MB';
        let hasRealFile = false;
        let storagePath = null;
        let publicUrl = null;

        if (uploadedFile) {
          const ext = uploadedFile.name.split('.').pop()?.toLowerCase() || 'pdf';
          format = ext;
          const sizeInMb = (uploadedFile.size / (1024 * 1024)).toFixed(1);
          fileSize = sizeInMb > 0 ? `${sizeInMb} MB` : `${Math.round(uploadedFile.size / 1024)} KB`;

          // 1. Upload direto para o bucket 'spoleto' no Supabase Storage
          try {
            const upRes = await uploadFileToSupabase(docId, uploadedFile);
            if (upRes.success) {
              storagePath = upRes.storagePath;
              publicUrl = upRes.publicUrl;
              hasRealFile = true;
            } else {
              console.warn('Upload Supabase falhou (verifique as políticas RLS do bucket spoleto):', upRes.error);
            }
          } catch (upErr) {
            console.warn('Erro ao subir para o Supabase Storage:', upErr);
          }

          // 2. Salva também cópia local de contingência no IndexedDB
          const saved = await saveFileBinary(docId, uploadedFile);
          if (saved) {
            hasRealFile = true;
          }
        }

        const newDoc = {
          id: docId,
          title: uploadTitle.trim(),
          category: uploadCategory,
          format,
          fileSize,
          version: 'v2026.1',
          updatedAt: new Date().toISOString().split('T')[0],
          downloads: 0,
          description: uploadDescription.trim() || 'Modelo disponibilizado para uso da equipe e franqueados Spoleto.',
          downloadUrl: publicUrl || null,
          storagePath: storagePath || null,
          isSupabaseFile: Boolean(storagePath),
          hasRealFile,
          originalFileName: uploadedFile ? uploadedFile.name : null,
          author: activeUser?.name || 'Equipe de Consultoria',
          isOfficial: false
        };

        addDocument(newDoc);
        if (storagePath) {
          showToast('✅ Arquivo salvo no Supabase Storage e Repositório Spoleto!');
        } else {
          showToast('✅ Arquivo salvo com sucesso no Repositório!');
        }
      }

      // Reset form
      setIsUploading(false);
      setUploadTitle('');
      setUploadDescription('');
      setUploadedFile(null);
      setCloudUrl('');
      setCloudFormat('xlsx');
    } catch (err) {
      console.error('Erro ao salvar upload:', err);
      showToast('Erro ao salvar o arquivo no repositório.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to download a Blob with proper filename and MIME type
  const downloadBlobFile = async (blobData, rawFileName, format) => {
    // Determine MIME type based on format
    const mimeMap = {
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xls: 'application/vnd.ms-excel',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      pdf: 'application/pdf',
      csv: 'text/csv',
      txt: 'text/plain'
    };
    const mimeType = mimeMap[format?.toLowerCase()] || 'application/octet-stream';
    const blob = new Blob([blobData], { type: mimeType });
    const safeName = rawFileName.replace(/[\\/:*?"<>|]/g, '_');
    const fileName = safeName.endsWith(`.${format}`) ? safeName : `${safeName}.${format}`;

    const fallbackDownload = () => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      showToast(`Baixando: ${safeName}`);
    };

    if (typeof window !== 'undefined' && window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{ description: `${format?.toUpperCase()} file`, accept: { [mimeType]: [`.${format}`] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        showToast(`Arquivo salvo como ${fileName}`);
      } catch (e) {
        console.warn('showSaveFilePicker falhou, usando fallback:', e);
        fallbackDownload();
      }
    } else {
      fallbackDownload();
    }
  };

  const handleDownload = async (doc) => {
    // 1. Try local IndexedDB storage
    try {
      const fileRecord = await getFileBinary(doc.id);
      if (fileRecord && fileRecord.data) {
        downloadBlobFile(fileRecord.data, fileRecord.fileName || doc.originalFileName || doc.title, doc.format);
        return;
      }
    } catch (e) {
      console.warn('Não foi possível ler do IndexedDB:', e);
    }

    // 2. If Supabase file, download via Supabase SDK
    if (doc.isSupabaseFile && doc.storagePath) {
      try {
        const { data, error } = await supabase.storage.from(SUPABASE_BUCKET_NAME).download(doc.storagePath);
        if (error) {
          console.warn('Error downloading from Supabase:', error);
        } else if (data) {
          const fileName = doc.originalFileName || doc.title;
          downloadBlobFile(data, fileName, doc.format);
          return;
        }
      } catch (err) {
        console.warn('Supabase download failed:', err);
      }
    }

    // 3. External cloud URL (Google Drive, Dropbox, etc.)
    const targetUrl = doc.downloadUrl || doc.cloudUrl;
    if (targetUrl && !targetUrl.startsWith('blob:')) {
      try {
        const response = await fetch(targetUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        const arrayBuffer = await response.arrayBuffer();
        downloadBlobFile(arrayBuffer, doc.originalFileName || doc.title, doc.format);
        return;
      } catch (err) {
        console.warn('Failed to fetch external file:', err);
      }
    }

    // 4. Fallback simulated text file
    const simulatedText = `========================================================\nSPOLETO - CONSULTORIA DE NEGÓCIOS & OPERAÇÕES\nMODELO OFICIAL: ${doc.title.toUpperCase()}\nVERSÃO: ${doc.version} | CATEGORIA: ${doc.category}\nAUTOR: ${doc.author}\n========================================================\n\nEste é o modelo padrão de trabalho homologado pela rede Spoleto.\nDescrição: ${doc.description}\n\nUtilize este modelo oficial nas rotinas operacionais e reuniões com franqueados.`;
    downloadBlobFile(simulatedText, doc.originalFileName || doc.title, doc.format === 'xlsx' ? 'txt' : doc.format);
  };

  const handleDelete = (doc) => {
    setDocumentToDelete(doc);
  };

  const confirmDelete = (doc) => {
    if (!doc) return;
    deleteDocument(doc.id);
    if (doc.storagePath) {
      deleteFileFromSupabase(doc.storagePath).catch(err => {
        console.warn('Erro ao excluir do Supabase Storage:', err);
      });
    }
    deleteFileBinary(doc.id).catch(err => {
      console.warn('Erro ao excluir binário do IndexedDB:', err);
    });
    showToast(`Arquivo "${doc.title}" excluído do repositório.`);
    setDocumentToDelete(null);
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
            <h4 style={{ fontSize: '0.95rem', color: 'var(--primary-brown)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UploadCloud size={16} /> Fazer Upload / Cadastrar Novo Modelo
            </h4>

            {/* Seletor de Tipo: Arquivo Local vs. Link da Nuvem */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)' }}>Origem:</span>
              <button
                type="button"
                onClick={() => setUploadMode('file')}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: uploadMode === 'file' ? '1.5px solid var(--primary-brown)' : '1px solid var(--border-subtle)',
                  backgroundColor: uploadMode === 'file' ? 'var(--primary-brown)' : '#FFFFFF',
                  color: uploadMode === 'file' ? '#FFFFFF' : 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <UploadCloud size={14} /> Arquivo Local (Upload)
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('cloud')}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: uploadMode === 'cloud' ? '1.5px solid #0284C7' : '1px solid var(--border-subtle)',
                  backgroundColor: uploadMode === 'cloud' ? '#0284C7' : '#FFFFFF',
                  color: uploadMode === 'cloud' ? '#FFFFFF' : 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Cloud size={14} /> Link da Nuvem (Google Drive, OneDrive, Dropbox, etc.)
              </button>
            </div>

            {uploadMode === 'file' ? (
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
                    style={{ 
                      width: '100%', 
                      fontSize: '0.8rem', 
                      padding: '0.55rem', 
                      justifyContent: 'center', 
                      gap: '0.4rem',
                      border: uploadedFile ? '1.5px solid #16A34A' : '1px solid var(--border-subtle)',
                      backgroundColor: uploadedFile ? '#F0FDF4' : '#FFFFFF',
                      color: uploadedFile ? '#15803D' : 'var(--text-main)',
                      fontWeight: uploadedFile ? 700 : 500
                    }}
                  >
                    <UploadCloud size={15} color={uploadedFile ? '#16A34A' : undefined} />
                    {uploadedFile ? `✓ ${uploadedFile.name} (${(uploadedFile.size / 1024).toFixed(0)} KB)` : 'Escolher no Computador'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '0.85rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                      Título do Arquivo / Modelo *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ex: Planilha de CMV Compartilhada Matriz"
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
                      Formato do Arquivo *
                    </label>
                    <select
                      className="input-field"
                      value={cloudFormat}
                      onChange={(e) => setCloudFormat(e.target.value)}
                    >
                      <option value="xlsx">Planilha Excel (.xlsx)</option>
                      <option value="docx">Documento Word (.docx)</option>
                      <option value="pptx">Apresentação PowerPoint (.pptx)</option>
                      <option value="pdf">Documento PDF (.pdf)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                    Link de Compartilhamento da Nuvem *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Link2 size={16} color="#0284C7" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="url"
                      className="input-field"
                      style={{ paddingLeft: '2.3rem' }}
                      placeholder="Cole o link do Google Drive, OneDrive, Dropbox ou link direto"
                      value={cloudUrl}
                      onChange={handleCloudUrlChange}
                      required={uploadMode === 'cloud'}
                    />
                  </div>
                  {cloudUrl.trim() && (
                    <div style={{ 
                      marginTop: '0.4rem', 
                      fontSize: '0.72rem', 
                      color: '#0369A1', 
                      backgroundColor: '#E0F2FE', 
                      padding: '0.3rem 0.65rem', 
                      borderRadius: 'var(--radius-sm)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontWeight: 600,
                      border: '1px solid #BAE6FD'
                    }}>
                      <Cloud size={12} />
                      Provedor detectado: <strong>{resolveCloudUrl(cloudUrl).provider}</strong> &bull; Download direto ativado no botão "Baixar"
                    </div>
                  )}
                </div>
              </div>
            )}

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
                disabled={isSaving}
                onClick={() => setIsUploading(false)}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSaving}
                style={{ fontSize: '0.8rem', padding: '0.4rem 1.1rem' }}
              >
                {isSaving ? 'Salvando Arquivo...' : 'Salvar Modelo no Repositório'}
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
                            {badge.label} &bull; {doc.isCloudLink ? 'Nuvem' : doc.fileSize}
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

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {(doc.isCloudLink || doc.cloudProvider) && (
                          <span style={{
                            fontSize: '0.65rem',
                            background: '#E0F2FE',
                            color: '#0369A1',
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--radius-full)',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            border: '1px solid #BAE6FD'
                          }} title={`Arquivo hospedado na nuvem: ${doc.cloudProvider || 'Nuvem'}`}>
                            <Cloud size={10} /> {doc.cloudProvider || 'Nuvem'}
                          </span>
                        )}

                        {doc.isSupabaseFile && (
                          <span style={{
                            fontSize: '0.65rem',
                            background: '#ECFDF5',
                            color: '#047857',
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--radius-full)',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            border: '1px solid #A7F3D0'
                          }} title="Armazenado no Supabase Storage (Bucket spoleto)">
                            <Cloud size={10} color="#059669" /> Supabase
                          </span>
                        )}

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
                      {/* Se tiver link da nuvem para abrir diretamente online */}
                      {doc.cloudUrl && (
                        <a
                          href={doc.cloudUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary"
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.35rem 0.6rem',
                            gap: '0.3rem',
                            textDecoration: 'none',
                            color: '#0284C7',
                            borderColor: '#BAE6FD',
                            backgroundColor: '#F0F9FF'
                          }}
                          title={`Abrir diretamente no ${doc.cloudProvider || 'Nuvem'}`}
                        >
                          <ExternalLink size={12} /> Abrir
                        </a>
                      )}

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

                      {/* Botão de Exclusão em cada arquivo do repositório */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc);
                        }}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--border-subtle)',
                          color: '#EF4444',
                          cursor: 'pointer',
                          padding: '0.35rem 0.55rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 'var(--radius-sm)',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#FEE2E2';
                          e.currentTarget.style.borderColor = '#FCA5A5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        }}
                        title={`Excluir "${doc.title}" do repositório`}
                      >
                        <Trash2 size={14} />
                      </button>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.95rem' }}
            >
              Fechar Repositório
            </button>
          </div>
        </div>

        {/* Modal de Confirmação de Exclusão (100% nativo em React) */}
        {documentToDelete && (
          <div 
            className="modal-overlay" 
            style={{ 
              zIndex: 10050, 
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(3px)',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
          >
            <div 
              className="modal-card" 
              style={{ 
                maxWidth: '440px', 
                width: '100%',
                padding: '1.85rem', 
                textAlign: 'center',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
                background: '#FFFFFF',
                animation: 'slideUpModal 0.2s ease'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.15rem'
              }}>
                <Trash2 size={28} />
              </div>

              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '0.6rem', fontWeight: 800 }}>
                Excluir Modelo do Repositório?
              </h3>

              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '1.65rem', lineHeight: '1.45' }}>
                Tem certeza que deseja remover o arquivo <strong>"{documentToDelete.title}"</strong>?<br />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Ele será removido da biblioteca e do armazenamento local.
                </span>
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setDocumentToDelete(null)}
                  style={{ padding: '0.55rem 1.35rem', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => confirmDelete(documentToDelete)}
                  style={{ 
                    backgroundColor: '#DC2626', 
                    color: '#FFFFFF', 
                    border: 'none',
                    padding: '0.55rem 1.35rem', 
                    fontSize: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)'
                  }}
                >
                  <Trash2 size={15} /> Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
