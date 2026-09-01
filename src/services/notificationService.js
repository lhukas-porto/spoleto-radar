import { supabase, isSupabaseConfigured } from './supabase';
import { 
  generateDMinusOnePreventionEmail, 
  generateDZeroCriticalEscalationEmail,
  getVisitCriticalSla,
  formatBrDate
} from '../utils/dateHelpers';

const RESEND_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_RESEND_API_KEY) || (typeof process !== 'undefined' ? process.env?.VITE_RESEND_API_KEY || process.env?.RESEND_API_KEY : '');

/**
 * Envia e-mail via Resend API (ou simula com log caso chave não esteja configurada)
 */
export async function sendEmailViaResend({ to, subject, html, text, from = 'Spoleto Radar <onboarding@resend.dev>' }) {
  if (!RESEND_API_KEY) {
    console.warn('VITE_RESEND_API_KEY não configurada. E-mail simulado:', { to, subject });
    return { success: false, error: 'Chave Resend não configurada.' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data?.message || 'Erro ao enviar e-mail via Resend' };
    }

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Erro no envio via Resend:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Registra a notificação no Supabase para histórico e controle de régua
 */
export async function logNotificationToSupabase({ type, title, message, recipientEmail, storeId, visitId, status = 'sent' }) {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type,
        title,
        message,
        recipient_email: recipientEmail,
        channel: 'email',
        status,
        store_id: storeId,
        visit_id: visitId,
        sent_at: new Date().toISOString()
      });

    if (error) console.error('Erro ao gravar notificação no Supabase:', error);
    return data;
  } catch (e) {
    console.error('Erro na gravação da notificação:', e);
    return null;
  }
}
