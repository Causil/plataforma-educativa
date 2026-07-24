/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL de la Lambda del tutor (T-603); sin definir → fallback local. */
  readonly VITE_TUTOR_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
