interface ImportMetaEnv {
  /** Endpoint dei form (vuoto = Netlify Forms). Vedi src/config.ts. */
  readonly PUBLIC_FORM_ENDPOINT?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
