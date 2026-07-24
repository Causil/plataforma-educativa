/** Respuesta del tutor — compartida entre la capa Node (SDK) y la del navegador. */
export interface TutorAnswer {
  text: string;
  /** 'ai' = respuesta del modelo · 'fallback' = respaldo local. */
  source: 'ai' | 'fallback';
}
