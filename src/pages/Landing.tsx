import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '../components/Logo';

export default function Landing() {
  const nav = useNavigate();
  const { t } = useTranslation();
  return (
    <div className="wrap">
      <header className="topbar">
        <div className="brand">
          <Logo />
          <div>
            <h1>{t('app.name')}</h1>
            <div className="tag">{t('app.tagline')}</div>
          </div>
        </div>
        <div className="spacer" />
        <button className="btn" onClick={() => nav('/login')}>
          {t('landing.ctaLogin')}
        </button>
      </header>

      <section className="hero">
        <Logo size="hero" />
        <div>
          <span className="badge">{t('landing.badge')}</span>
        </div>
        <h1>
          Cursos que se adaptan a <em>cada</em> estudiante
        </h1>
        <p>{t('landing.subtitle')}</p>
        <div className="cta">
          <button className="btn primary" onClick={() => nav('/curso')}>
            {t('landing.ctaCourse')}
          </button>
          <button className="btn" onClick={() => nav('/practica')}>
            Probar la práctica adaptativa
          </button>
        </div>
      </section>

      <section className="steps3">
        {([1, 2, 3] as const).map((n) => (
          <div className="card step-c" key={n}>
            <div className="n">0{n}</div>
            <h3>{t(`landing.step${n}t`)}</h3>
            <p>{t(`landing.step${n}d`)}</p>
          </div>
        ))}
      </section>

      <p className="foot-note">
        <b>GuIA</b> · Estadística CBS00074 — Politécnico JIC · motor adaptativo con 36 tests ✔
      </p>
    </div>
  );
}
