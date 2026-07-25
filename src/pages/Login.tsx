import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import {
  completeNewPassword,
  confirmReset,
  doSignIn,
  requestReset,
} from '../lib/auth';
import { HOME_BY_ROLE, useAuth } from '../state/AuthContext';

type Phase =
  | 'login'
  | 'new-password' // primer ingreso de matriculado por universidad
  | 'forgot-email'
  | 'forgot-code'
  | 'forgot-done';

const field: React.CSSProperties = {
  width: '100%', fontSize: 14.5, background: 'var(--surface-2)', color: 'var(--ink)',
  border: '1.5px solid var(--line)', borderRadius: 10, padding: '11px 13px', margin: '5px 0 13px',
};
const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' };

export default function Login() {
  const nav = useNavigate();
  const { refresh } = useAuth();
  const [phase, setPhase] = useState<Phase>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPass, setNewPass] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enterByRole = async () => {
    const s = await refresh();
    nav(s ? HOME_BY_ROLE[s.role] : '/login');
  };

  const onLogin = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await doSignIn(email, password);
    setBusy(false);
    if (r.kind === 'ok') return void enterByRole();
    if (r.kind === 'new-password-required') return setPhase('new-password');
    setError(r.message);
  };

  const onNewPassword = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await completeNewPassword(newPass);
    setBusy(false);
    if (r.kind === 'ok') return void enterByRole();
    setError(r.kind === 'error' ? r.message : 'No se pudo completar.');
  };

  const onForgotEmail = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await requestReset(email);
    setBusy(false);
    if (r.ok) return setPhase('forgot-code');
    setError(r.message ?? null);
  };

  const onForgotCode = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await confirmReset(email, code, newPass);
    setBusy(false);
    if (r.ok) return setPhase('forgot-done');
    setError(r.message ?? null);
  };

  const back = () => {
    setPhase('login');
    setError(null);
    setPassword('');
    setNewPass('');
    setCode('');
  };

  return (
    <div className="wrap" style={{ minHeight: '80vh', display: 'grid', placeItems: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: 410, padding: 28 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Logo />
          </div>
          <h2 style={{ fontSize: 21, margin: '14px 0 4px' }}>
            {phase === 'login' && 'Inicia sesión en GuIA'}
            {phase === 'new-password' && 'Primer ingreso 🎓'}
            {(phase === 'forgot-email' || phase === 'forgot-code') && 'Recuperar contraseña'}
            {phase === 'forgot-done' && '¡Contraseña restablecida!'}
          </h2>
          <p style={{ fontSize: 13.5, color: 'var(--ink-3)', margin: 0 }}>
            {phase === 'login' && 'Tu rol lo asigna la plataforma según tu cuenta'}
            {phase === 'new-password' &&
              'Tu universidad te matriculó. Crea tu contraseña definitiva para activar tu cuenta.'}
            {phase === 'forgot-email' && 'Te enviaremos un código a tu correo'}
            {phase === 'forgot-code' && `Revisa el código enviado a ${email}`}
            {phase === 'forgot-done' && 'Ya puedes iniciar sesión con tu nueva contraseña'}
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'var(--warm-soft)', color: 'var(--warm)', borderRadius: 10,
              padding: '10px 13px', fontSize: 13, marginBottom: 14, fontWeight: 600,
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        {phase === 'login' && (
          <form onSubmit={onLogin}>
            <label style={label}>
              Correo
              <input style={field} type="email" required autoComplete="username"
                value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
            </label>
            <label style={label}>
              Contraseña
              <input style={field} type="password" required autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <button className="btn primary block" disabled={busy}>
              {busy ? 'Entrando…' : 'Entrar'}
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14, textAlign: 'center' }}>
              <button type="button" className="link" onClick={() => { setPhase('forgot-email'); setError(null); }}>
                ¿Olvidaste tu contraseña?
              </button>
              <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
                ¿Tu universidad te matriculó? Entra con la contraseña temporal de tu correo de
                invitación — te pediremos crear la definitiva.
              </span>
            </div>
          </form>
        )}

        {phase === 'new-password' && (
          <form onSubmit={onNewPassword}>
            <label style={label}>
              Crea tu contraseña definitiva
              <input style={field} type="password" required minLength={8} autoComplete="new-password"
                value={newPass} onChange={(e) => setNewPass(e.target.value)}
                placeholder="mín. 8: mayúscula, minúscula, número y símbolo" />
            </label>
            <button className="btn primary block" disabled={busy}>
              {busy ? 'Activando…' : 'Crear contraseña y entrar'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button type="button" className="link" onClick={back}>← Volver</button>
            </div>
          </form>
        )}

        {phase === 'forgot-email' && (
          <form onSubmit={onForgotEmail}>
            <label style={label}>
              Correo registrado
              <input style={field} type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
            </label>
            <button className="btn primary block" disabled={busy}>
              {busy ? 'Enviando…' : 'Enviar código'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button type="button" className="link" onClick={back}>← Volver</button>
            </div>
          </form>
        )}

        {phase === 'forgot-code' && (
          <form onSubmit={onForgotCode}>
            <label style={label}>
              Código del correo
              <input style={field} inputMode="numeric" required value={code}
                onChange={(e) => setCode(e.target.value)} placeholder="123456" />
            </label>
            <label style={label}>
              Nueva contraseña
              <input style={field} type="password" required minLength={8} autoComplete="new-password"
                value={newPass} onChange={(e) => setNewPass(e.target.value)} />
            </label>
            <button className="btn primary block" disabled={busy}>
              {busy ? 'Confirmando…' : 'Restablecer contraseña'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button type="button" className="link" onClick={back}>← Volver</button>
            </div>
          </form>
        )}

        {phase === 'forgot-done' && (
          <button className="btn primary block" onClick={back}>
            Ir a iniciar sesión
          </button>
        )}
      </div>
    </div>
  );
}
