import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '../components/Logo';

type Role = 'est' | 'prof' | 'adm';
const DEST: Record<Role, string> = { est: '/curso', prof: '/docente', adm: '/admin' };

/** UI de login — la autenticación real (Cognito) llega con T-203. */
export default function Login() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const [role, setRole] = useState<Role>('est');

  const roles: { id: Role; icon: string; label: string }[] = [
    { id: 'est', icon: '🎓', label: t('login.student') },
    { id: 'prof', icon: '🧑‍🏫', label: t('login.teacher') },
    { id: 'adm', icon: '⚙️', label: t('login.admin') },
  ];

  return (
    <div className="wrap" style={{ minHeight: '80vh', display: 'grid', placeItems: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: 410, padding: 28 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Logo />
          </div>
          <h2 style={{ fontSize: 21, margin: '14px 0 4px' }}>{t('login.title')}</h2>
          <p style={{ fontSize: 13.5, color: 'var(--ink-3)', margin: 0 }}>{t('login.subtitle')}</p>
        </div>

        <div
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6,
            background: 'var(--surface-2)', border: '1px solid var(--line)',
            borderRadius: 12, padding: 5, marginBottom: 18,
          }}
        >
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className="btn sm"
              style={{
                border: 'none',
                background: role === r.id ? 'var(--surface)' : 'transparent',
                color: role === r.id ? 'var(--brand-ink)' : 'var(--ink-2)',
                boxShadow: role === r.id ? 'var(--shadow)' : 'none',
              }}
            >
              {r.icon} {r.label}
            </button>
          ))}
        </div>

        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>
          {t('login.email')}
          <input
            type="email"
            defaultValue="sofia@correo.com"
            style={{
              width: '100%', fontSize: 14.5, background: 'var(--surface-2)', color: 'var(--ink)',
              border: '1.5px solid var(--line)', borderRadius: 10, padding: '11px 13px', margin: '5px 0 13px',
            }}
          />
        </label>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>
          {t('login.password')}
          <input
            type="password"
            defaultValue="········"
            style={{
              width: '100%', fontSize: 14.5, background: 'var(--surface-2)', color: 'var(--ink)',
              border: '1.5px solid var(--line)', borderRadius: 10, padding: '11px 13px', margin: '5px 0 16px',
            }}
          />
        </label>
        <button className="btn primary block" onClick={() => nav(DEST[role])}>
          {t('login.enter')}
        </button>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', marginTop: 12 }}>
          Cognito real (recuperación + primer ingreso) llega con T-203/T-205
        </p>
      </div>
    </div>
  );
}
