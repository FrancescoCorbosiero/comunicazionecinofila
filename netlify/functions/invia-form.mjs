/* Netlify Function: stessa logica del server Docker (server/form-handler.mjs).
   Serve solo se il sito gira su Netlify: in quel caso builda con
   PUBLIC_FORM_ENDPOINT=/.netlify/functions/invia-form e imposta le stesse
   variabili SES nelle impostazioni del sito. */
import { handleForm } from '../../server/form-handler.mjs';

export default async (req) => {
  if (req.method !== 'POST') return Response.json({ ok: false }, { status: 405 });
  const { status, body } = await handleForm(await req.text(), {
    ip: req.headers.get('x-nf-client-connection-ip') ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
    referer: req.headers.get('referer') ?? undefined,
  });
  return Response.json(body, { status });
};
