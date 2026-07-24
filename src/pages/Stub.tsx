import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';

/** Placeholder para pantallas que se conectan en épicas posteriores (E9/E10). */
export default function Stub({ title, epic }: { title: string; epic: string }) {
  const nav = useNavigate();
  return (
    <div className="wrap" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
      <div className="card" style={{ padding: 32, textAlign: 'center', maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Logo />
        </div>
        <h2 style={{ margin: '14px 0 6px' }}>{title}</h2>
        <p style={{ color: 'var(--ink-2)', fontSize: 14 }}>
          Esta pantalla se conecta en la épica <b>{epic}</b> (ver diseño completo en el prototipo
          v2.3 aprobado).
        </p>
        <button className="btn" onClick={() => nav('/')}>← Volver</button>
      </div>
    </div>
  );
}
