/**
 * Constantes compartidas del backend Amplify.
 */

/** URL pública de la aplicación (Amplify Hosting). */
export const APP_URL = 'https://main.dnshoh9una50.amplifyapp.com';

/**
 * Parámetro SSM (SecureString) con la API key de Anthropic. Una sola clave
 * para sandbox y producción: las Lambdas lo leen en el arranque en frío
 * (amplify/functions/_shared/anthropic-key.ts) en lugar de usar secret(),
 * que solo busca en rutas propias de cada ambiente.
 */
export const ANTHROPIC_KEY_PARAM =
  '/amplify/guiaplataformaeducativa/javier-sandbox-ecd5c9f8fb/ANTHROPIC_API_KEY';
