// =========================================================================
// Gerenciador de Armazenamento Híbrido: Supabase Storage + IndexedDB Local
// Repositório de Documentos & Modelos Oficiais Spoleto
// =========================================================================

import { supabase, isSupabaseConfigured } from './supabase';

export const SUPABASE_BUCKET_NAME = 'spoleto';
export const SUPABASE_REPOSITORY_FOLDER = 'repository';

const DB_NAME = 'spoleto_repository_files_db';
const STORE_NAME = 'documents_binaries';
const DB_VERSION = 1;

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB não suportado neste navegador.'));
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => {
        console.error('Erro ao abrir IndexedDB:', e);
        reject(request.error);
      };
    });
  }
  return dbPromise;
}

/**
 * Salva o arquivo real (File/Blob) de forma 100% persistente no disco local
 */
export async function saveFileBinary(docId, file) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record = {
        id: docId,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        data: file, // File é derivado de Blob e é suportado nativamente pelo IndexedDB
        savedAt: new Date().toISOString()
      };

      const req = store.put(record);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => {
        console.error('Erro ao gravar arquivo no IndexedDB:', e);
        reject(req.error);
      };
    });
  } catch (err) {
    console.error('Falha em saveFileBinary:', err);
    return false;
  }
}

/**
 * Recupera o registro do arquivo salvo pelo ID do documento
 */
export async function getFileBinary(docId) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(docId);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = (e) => {
        console.error('Erro ao buscar arquivo no IndexedDB:', e);
        reject(req.error);
      };
    });
  } catch (err) {
    console.error('Falha em getFileBinary:', err);
    return null;
  }
}

/**
 * Remove o arquivo binário do IndexedDB
 */
export async function deleteFileBinary(docId) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(docId);

      req.onsuccess = () => resolve(true);
      req.onerror = (e) => {
        console.error('Erro ao remover arquivo do IndexedDB:', e);
        reject(req.error);
      };
    });
  } catch (err) {
    console.error('Falha em deleteFileBinary:', err);
    return false;
  }
}

/**
 * Faz upload do arquivo físico diretamente para o bucket 'spoleto' do Supabase Storage
 */
export async function uploadFileToSupabase(docId, file) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase não inicializado ou configurado.' };
  }

  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${SUPABASE_REPOSITORY_FOLDER}/${docId}_${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Erro ao enviar arquivo para o Supabase Storage:', error);
      return { success: false, error: error.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from(SUPABASE_BUCKET_NAME)
      .getPublicUrl(storagePath);

    return {
      success: true,
      storagePath,
      publicUrl: publicUrlData.publicUrl
    };
  } catch (err) {
    console.error('Falha inesperada no upload Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Remove o arquivo do bucket do Supabase Storage
 */
export async function deleteFileFromSupabase(storagePath) {
  if (!isSupabaseConfigured || !supabase || !storagePath) {
    return false;
  }

  try {
    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      console.warn('Erro ao remover arquivo do Supabase Storage:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Falha inesperada ao remover do Supabase:', err);
    return false;
  }
}

