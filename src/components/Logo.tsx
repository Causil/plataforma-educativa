/** Logo ∞ de GuIA (lemniscata — guiño al toro/botella de Klein, R19). */
export function Logo({ size = '' }: { size?: '' | 'sm' | 'hero' }) {
  return (
    <div className={`mark ${size}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
        <path d="M12 12 C10 8.6, 4.6 8.6, 4.6 12 C4.6 15.4, 10 15.4, 12 12 C14 8.6, 19.4 8.6, 19.4 12 C19.4 15.4, 14 15.4, 12 12 Z" />
      </svg>
    </div>
  );
}
