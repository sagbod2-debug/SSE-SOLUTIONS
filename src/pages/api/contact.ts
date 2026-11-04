import type { APIRoute } from 'astro';

export const prerender = false;

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 heure
const MAX_REQUESTS_PER_HOUR = 5;
const ipHits = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = (ipHits.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS_PER_HOUR) {
    ipHits.set(ip, timestamps);
    return false;
  }
  timestamps.push(now);
  ipHits.set(ip, timestamps);
  return true;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function resolveRecipient(sujet: string): string {
  const normalized = sujet.trim().toLowerCase();
  if (normalized.includes('consulting')) {
    return 'ccconsulting@ssesolutions.fr';
  }
  // CC Care, Autonomie & Inclusion, CC Events et tout autre sujet
  return 'cccare@ssesolutions.fr';
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const acceptHeader = request.headers.get('accept') || '';
  const contentType = request.headers.get('content-type') || '';
  const wantsJson =
    acceptHeader.includes('application/json') || contentType.includes('application/json');

  const respond = (status: number, payload: { ok: boolean; message: string; fallbackEmail?: string }) => {
    if (wantsJson) {
      return new Response(JSON.stringify(payload), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }
    // Repli HTML classique sans mettre de données personnelles dans l'URL
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${
      payload.ok ? 'Message envoyé' : 'Erreur d’envoi'
    } — SSE Solutions</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{background:#111416;color:#EDEEEF;font-family:sans-serif;padding:3rem;max-width:42rem;margin:0 auto;line-height:1.6}a{color:#C9A24B}</style></head><body><h1>${
      payload.ok ? 'Message envoyé.' : 'Envoi impossible.'
    }</h1><p role="${payload.ok ? 'status' : 'alert'}">${escapeHtml(payload.message)}</p>${
      payload.fallbackEmail
        ? `<p>Vous pouvez nous écrire directement à <a href="mailto:${escapeHtml(
            payload.fallbackEmail
          )}">${escapeHtml(payload.fallbackEmail)}</a>.</p>`
        : ''
    }<p><a href="/contact">← Retour à la page de contact</a></p></body></html>`;
    return new Response(html, {
      status,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  };

  try {
    let data: Record<string, string> = {};
    if (contentType.includes('application/json')) {
      const json = await request.json();
      for (const [k, v] of Object.entries(json || {})) {
        data[k] = typeof v === 'string' ? v : String(v ?? '');
      }
    } else {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        data[key] = typeof value === 'string' ? value : '';
      });
    }

    // 1. Piège à robots bot-field : s'il est rempli, répondre 200 sans rien envoyer
    const botField = (data['bot-field'] || '').trim();
    if (botField.length > 0) {
      return respond(200, {
        ok: true,
        message: 'Merci. Votre message est bien arrivé. Nous vous répondons sous 48 heures ouvrées.',
      });
    }

    const sujet = (data.sujet || 'CC Care').trim();
    const recipient = resolveRecipient(sujet);

    // 2. Limitation à 5 envois par heure et par adresse IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip =
      (forwardedFor ? forwardedFor.split(',')[0].trim() : '') ||
      request.headers.get('x-real-ip') ||
      clientAddress ||
      'unknown';

    if (!checkRateLimit(ip)) {
      return respond(429, {
        ok: false,
        message:
          'Vous avez atteint la limite de 5 envois par heure. Merci de patienter ou de nous écrire directement par e-mail.',
        fallbackEmail: recipient,
      });
    }

    // 3. Validation côté serveur
    const nom = (data.nom || '').trim();
    const structure = (data.structure || '').trim();
    const email = (data.email || '').trim();
    const telephone = (data.telephone || '').trim();
    const message = (data.message || '').trim();
    const consentement =
      data.consentement === 'on' ||
      data.consentement === 'true' ||
      data.consentement === '1';

    if (!nom || nom.length < 2) {
      return respond(400, {
        ok: false,
        message: 'Veuillez indiquer votre nom et prénom.',
        fallbackEmail: recipient,
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return respond(400, {
        ok: false,
        message: 'Veuillez saisir une adresse e-mail valide.',
        fallbackEmail: recipient,
      });
    }

    if (message.length < 10 || message.length > 5000) {
      return respond(400, {
        ok: false,
        message: 'Votre message doit contenir entre 10 et 5 000 caractères.',
        fallbackEmail: recipient,
      });
    }

    if (!consentement) {
      return respond(400, {
        ok: false,
        message: 'Veuillez accepter que SSE Solutions utilise ces informations pour vous répondre.',
        fallbackEmail: recipient,
      });
    }

    // 4. Envoi par l'API Resend
    const resendApiKey =
      import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY || '';
    const domainVerified =
      (import.meta.env.RESEND_DOMAIN_VERIFIED || process.env.RESEND_DOMAIN_VERIFIED) === 'true';

    // Expéditeur site@ssesolutions.fr une fois le domaine vérifié au lot 4 ; d'ici là, l'expéditeur de test de Resend
    const fromAddress = domainVerified
      ? 'SSE Solutions <site@ssesolutions.fr>'
      : 'SSE Solutions <onboarding@resend.dev>';

    if (!resendApiKey) {
      return respond(503, {
        ok: false,
        message:
          "Le service d'envoi est en cours de configuration. Vous pouvez nous écrire directement à l'adresse ci-dessous.",
        fallbackEmail: recipient,
      });
    }

    const htmlBody = `
      <div style="font-family:sans-serif;line-height:1.6;color:#15181A;max-width:600px">
        <h2 style="margin-bottom:16px">Nouveau message — ${escapeHtml(sujet)}</h2>
        <p><strong>Nom et prénom :</strong> ${escapeHtml(nom)}</p>
        <p><strong>Structure ou entreprise :</strong> ${escapeHtml(structure || 'Non renseignée')}</p>
        <p><strong>E-mail :</strong> ${escapeHtml(email)}</p>
        <p><strong>Téléphone :</strong> ${escapeHtml(telephone || 'Non renseigné')}</p>
        <p><strong>Sujet :</strong> ${escapeHtml(sujet)}</p>
        <hr style="border:none;border-top:1px solid #ddd;margin:20px 0" />
        <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
      </div>
    `;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [recipient],
        reply_to: email,
        subject: `[SSE Solutions · ${sujet}] Message de ${nom}`,
        html: htmlBody,
        text: `Sujet: ${sujet}\nNom: ${nom}\nStructure: ${structure || '-'}\nE-mail: ${email}\nTéléphone: ${telephone || '-'}\n\nMessage:\n${message}`,
      }),
    });

    if (!resendRes.ok) {
      return respond(502, {
        ok: false,
        message:
          "L'envoi automatique n'a pas pu aboutir. Vos informations sont conservées dans le formulaire ; vous pouvez aussi nous écrire directement par e-mail.",
        fallbackEmail: recipient,
      });
    }

    return respond(200, {
      ok: true,
      message:
        'Merci. Votre message est bien arrivé. Nous vous répondons sous 48 heures ouvrées.',
    });
  } catch {
    return respond(500, {
      ok: false,
      message:
        "Une erreur technique est survenue lors de l'envoi. Vous pouvez nous écrire directement par e-mail.",
      fallbackEmail: 'cccare@ssesolutions.fr',
    });
  }
};

