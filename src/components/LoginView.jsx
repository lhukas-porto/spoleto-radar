import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Send, 
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import SpoletoRadarLogo from './SpoletoRadarLogo';
import { supabase, isSupabaseConfigured } from '../services/supabase';

// E-mail oficial autorizado nesta fase piloto
const AUTHORIZED_EMAIL = 'liliane.cury@spoleto.com.br';

export default function LoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState(AUTHORIZED_EMAIL);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('password'); // 'password' | 'first_access' | 'magic_link'
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Limpa mensagens ao trocar de aba ou digitar
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const validateEmailWhitelist = (rawEmail) => {
    const cleanEmail = (rawEmail || '').trim().toLowerCase();
    if (cleanEmail !== AUTHORIZED_EMAIL.toLowerCase()) {
      setErrorMessage(
        'Acesso Restrito: Nesta fase piloto de homologação, o Spoleto Radar está liberado exclusivamente para a Gerência Nacional (Liliane Cury).'
      );
      return false;
    }
    return true;
  };

  // 1. Login Tradicional por Senha (Supabase Auth)
  const handlePasswordLogin = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validateEmailWhitelist(email)) return;

    if (!password) {
      setErrorMessage('Por favor, informe a senha de acesso.');
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setErrorMessage('Conexão com o Supabase não configurada no ambiente.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage(
            'Senha incorreta ou usuário ainda não registrado no Supabase Auth. Se este for o seu primeiro acesso, use a aba "Primeiro Acesso" abaixo para definir sua senha inicial.'
          );
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMessage(
            'E-mail cadastrado, porém aguardando confirmação. Verifique sua caixa de entrada no e-mail corporativo.'
          );
        } else {
          setErrorMessage(error.message || 'Falha ao autenticar no Supabase Auth.');
        }
        setIsLoading(false);
        return;
      }

      setSuccessMessage('Autenticação autorizada com sucesso! Carregando painel...');
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(data.session);
        }
      }, 500);
    } catch (err) {
      console.error('Erro de login:', err);
      setErrorMessage('Erro inesperado de comunicação com o servidor de autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Primeiro Acesso / Cadastro de Senha Inicial no Supabase Auth
  const handleFirstAccess = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validateEmailWhitelist(email)) return;

    if (!password || password.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setErrorMessage('Conexão com o Supabase não configurada.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            name: 'LILIANE TAHAN CURY TEIXEIRA DE RESENDE',
            role: 'GERENTE_NACIONAL',
            region: 'Nacional / Brasil'
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          setErrorMessage(
            'Este e-mail já possui cadastro no Supabase Auth! Retorne para a aba "Entrar com Senha" para acessar.'
          );
        } else {
          setErrorMessage(error.message || 'Não foi possível registrar o primeiro acesso.');
        }
        setIsLoading(false);
        return;
      }

      // Se o projeto do Supabase não exigir confirmação de e-mail, já temos a sessão
      if (data?.session) {
        setSuccessMessage('Senha inicial cadastrada com sucesso! Entrando...');
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess(data.session);
        }, 500);
      } else {
        setSuccessMessage(
          'Registro enviado com sucesso! Se a confirmação por e-mail estiver ativa no Supabase, confira sua caixa postal para validar.'
        );
      }
    } catch (err) {
      console.error('Erro no primeiro acesso:', err);
      setErrorMessage('Falha ao processar o primeiro acesso no Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Enviar Link Mágico por E-mail (Magic Link)
  const handleMagicLink = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validateEmailWhitelist(email)) return;

    if (!isSupabaseConfigured || !supabase) {
      setErrorMessage('Conexão com o Supabase não configurada.');
      return;
    }

    setIsLoading(true);

    try {
      const redirectUrl = window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        setErrorMessage(error.message || 'Falha ao enviar link de acesso.');
      } else {
        setSuccessMessage(
          `Link de acesso seguro enviado com sucesso para ${email}! Verifique sua caixa de entrada.`
        );
      }
    } catch (err) {
      console.error('Erro ao enviar link mágico:', err);
      setErrorMessage('Erro de comunicação ao solicitar link por e-mail.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #1C0F0A 0%, #2B1810 50%, #150905 100%)',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Elementos Decorativos de Fundo */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(200, 16, 46, 0.18) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-10%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(241, 168, 10, 0.15) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />

      {/* Card Principal de Login */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Topo Institucional do Card */}
        <div style={{
          backgroundColor: '#24140E',
          padding: '2rem 1.75rem 1.5rem 1.75rem',
          textAlign: 'center',
          borderBottom: '3px solid #F1A80A',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <SpoletoRadarLogo variant="navbar" size="lg" />
          </div>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.75)', 
            fontSize: '0.82rem', 
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            fontWeight: 600,
            margin: 0
          }}>
            Portal Executivo de Gestão da Rede
          </p>

          <div style={{
            marginTop: '0.85rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'rgba(241, 168, 10, 0.18)',
            border: '1px solid rgba(241, 168, 10, 0.4)',
            padding: '0.25rem 0.75rem',
            borderRadius: '20px',
            fontSize: '0.74rem',
            color: '#FDE68A',
            fontWeight: 600
          }}>
            <ShieldCheck size={13} color="#F1A80A" />
            <span>Fase Piloto • Acesso Gerência Nacional</span>
          </div>
        </div>

        {/* Abas de Acesso */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #E2E8F0',
          backgroundColor: '#F8FAFC'
        }}>
          <button
            type="button"
            onClick={() => handleTabChange('password')}
            style={{
              flex: 1,
              padding: '0.75rem 0.5rem',
              border: 'none',
              background: activeTab === 'password' ? '#FFFFFF' : 'transparent',
              borderBottom: activeTab === 'password' ? '2px solid #C8102E' : 'none',
              color: activeTab === 'password' ? '#C8102E' : '#64748B',
              fontWeight: activeTab === 'password' ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Entrar com Senha
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('first_access')}
            style={{
              flex: 1,
              padding: '0.75rem 0.5rem',
              border: 'none',
              background: activeTab === 'first_access' ? '#FFFFFF' : 'transparent',
              borderBottom: activeTab === 'first_access' ? '2px solid #C8102E' : 'none',
              color: activeTab === 'first_access' ? '#C8102E' : '#64748B',
              fontWeight: activeTab === 'first_access' ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Primeiro Acesso
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('magic_link')}
            style={{
              flex: 1,
              padding: '0.75rem 0.5rem',
              border: 'none',
              background: activeTab === 'magic_link' ? '#FFFFFF' : 'transparent',
              borderBottom: activeTab === 'magic_link' ? '2px solid #C8102E' : 'none',
              color: activeTab === 'magic_link' ? '#C8102E' : '#64748B',
              fontWeight: activeTab === 'magic_link' ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Link por E-mail
          </button>
        </div>

        {/* Corpo do Formulário */}
        <div style={{ padding: '1.75rem' }}>
          {/* Alertas de Erro / Sucesso */}
          {errorMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              padding: '0.85rem',
              marginBottom: '1.25rem',
              fontSize: '0.82rem',
              color: '#991B1B',
              lineHeight: 1.45
            }}>
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
              backgroundColor: '#F0FDF4',
              border: '1px solid #86EFAC',
              borderRadius: '8px',
              padding: '0.85rem',
              marginBottom: '1.25rem',
              fontSize: '0.82rem',
              color: '#166534',
              lineHeight: 1.45
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{successMessage}</div>
            </div>
          )}

          {/* Form: Entrar com Senha */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordLogin}>
              <div style={{ marginBottom: '1.15rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  E-mail Corporativo
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: liliane.cury@spoleto.com.br"
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.75rem 0.75rem 2.4rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      color: '#0F172A',
                      outline: 'none',
                      transition: 'border-color 0.15s ease',
                      backgroundColor: '#FFFFFF',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#C8102E'}
                    onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                    Senha de Acesso
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTabChange('magic_link')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#C8102E',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: 600
                    }}
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha cadastrada no Supabase"
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.5rem 0.75rem 2.4rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      color: '#0F172A',
                      outline: 'none',
                      transition: 'border-color 0.15s ease',
                      backgroundColor: '#FFFFFF',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#C8102E'}
                    onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  backgroundColor: '#C8102E',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'background 0.15s ease',
                  opacity: isLoading ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(200, 16, 46, 0.25)'
                }}
                onMouseEnter={(e) => { if (!isLoading) e.target.style.backgroundColor = '#A50D24'; }}
                onMouseLeave={(e) => { if (!isLoading) e.target.style.backgroundColor = '#C8102E'; }}
              >
                {isLoading ? (
                  <span>Validando credenciais...</span>
                ) : (
                  <>
                    <span>Entrar no Spoleto Radar</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Form: Primeiro Acesso (Cadastro da Senha Inicial no Supabase) */}
          {activeTab === 'first_access' && (
            <form onSubmit={handleFirstAccess}>
              <div style={{
                backgroundColor: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '1.15rem',
                fontSize: '0.78rem',
                color: '#92400E',
                lineHeight: 1.4
              }}>
                <div style={{ fontWeight: 700, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <KeyRound size={14} color="#D97706" /> Definir Senha Inicial da Gerência Nacional
                </div>
                Digite uma senha segura para cadastrar o acesso da Liliane Cury diretamente no Supabase Auth.
              </div>

              <div style={{ marginBottom: '1.15rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  E-mail Autorizado
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.75rem 0.75rem 2.4rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      color: '#0F172A',
                      backgroundColor: '#F8FAFC',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Criar Nova Senha (mínimo 6 dígitos)
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ex: Spoleto@2026"
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.5rem 0.75rem 2.4rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      color: '#0F172A',
                      outline: 'none',
                      backgroundColor: '#FFFFFF',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#C8102E'}
                    onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  backgroundColor: '#D97706',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)'
                }}
              >
                {isLoading ? <span>Cadastrando...</span> : (
                  <>
                    <span>Cadastrar Senha no Supabase</span>
                    <Sparkles size={17} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Form: Link Mágico por E-mail (OTP / Magic Link) */}
          {activeTab === 'magic_link' && (
            <form onSubmit={handleMagicLink}>
              <div style={{
                backgroundColor: '#F0F9FF',
                border: '1px solid #BAE6FD',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '1.15rem',
                fontSize: '0.78rem',
                color: '#0369A1',
                lineHeight: 1.4
              }}>
                <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>Acesso sem Senha via E-mail</div>
                Um link de autenticação instantânea de uso único será gerado e enviado para o seu e-mail.</div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  E-mail Corporativo
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.75rem 0.75rem 2.4rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      color: '#0F172A',
                      backgroundColor: '#FFFFFF',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
                }}
              >
                {isLoading ? <span>Enviando link...</span> : (
                  <>
                    <span>Enviar Link para o E-mail</span>
                    <Send size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Aviso Institucional de Restrição */}
          <div style={{
            marginTop: '1.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#64748B',
            fontSize: '0.72rem',
            lineHeight: 1.35
          }}>
            <ShieldAlert size={15} color="#94A3B8" style={{ flexShrink: 0 }} />
            <span>
              Ambiente protegido com RLS e criptografia JWT. Acesso exclusivo autorizado para <strong>{AUTHORIZED_EMAIL}</strong>.
            </span>
          </div>
        </div>
      </div>

      {/* Rodapé da Página */}
      <div style={{
        marginTop: '1.5rem',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: '0.75rem'
      }}>
        Spoleto Radar © {new Date().getFullYear()} • Grupo Trigo • Operações Nacionais
      </div>
    </div>
  );
}
