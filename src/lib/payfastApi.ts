import crypto from 'crypto';

// Pause and unpause a PayFast recurring subscription.
//
// Used when an admin comps an account that is ALREADY PAYING: billing must
// stop while the comp runs, or they are told it is free while PayFast keeps
// taking the money.
//
// Pause, not cancel: the card stays on file and billing resumes by itself.
//
// PayFast: PUT /subscriptions/{token}/pause and /unpause. merchant-id,
// version, timestamp and signature go in the HEADERS. The signature is an
// MD5 of the alphabetised header and body values plus the passphrase.

const API_BASE = 'https://api.payfast.co.za/subscriptions';

export interface PayFastApiResult {
  ok: boolean;
  message: string;
}

function sign(fields: Record<string, string>): string {
  const str = Object.keys(fields)
    .sort()
    .map((k) => k + '=' + encodeURIComponent(fields[k]).replace(/%20/g, '+'))
    .join('&');
  return crypto.createHash('md5').update(str).digest('hex');
}

async function call(
  token: string,
  action: string,
  body?: Record<string, string>,
): Promise<PayFastApiResult> {
  const merchantId = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID;
  const passphrase = process.env.PAYFAST_PASSPHRASE;

  if (!merchantId || !passphrase) {
    console.error('payfastApi: merchant id or passphrase missing');
    return { ok: false, message: 'Payment configuration incomplete.' };
  }

  // SAST, which is what the account is set to.
  const now = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const timestamp = now.toISOString().replace(/\.\d{3}Z$/, '+02:00');

  const fields: Record<string, string> = {
    'merchant-id': merchantId,
    passphrase,
    timestamp,
    version: 'v1',
  };
  if (body) {
    Object.keys(body).forEach((k) => { fields[k] = body[k]; });
  }

  const signature = sign(fields);
  const sandbox = process.env.NEXT_PUBLIC_PAYFAST_SANDBOX === 'true';
  const url = API_BASE + '/' + encodeURIComponent(token) + '/' + action
    + (sandbox ? '?testing=true' : '');

  const headers: Record<string, string> = {
    'merchant-id': merchantId,
    version: 'v1',
    timestamp,
    signature,
  };
  if (body) headers['Content-Type'] = 'application/json';

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();

    if (!res.ok) {
      console.error('PayFast ' + action + ' failed (' + res.status + '): ' + text);
      return { ok: false, message: 'PayFast refused the ' + action + '.' };
    }

    console.log('PayFast subscription ' + action + ': ' + token);
    return { ok: true, message: 'Subscription ' + action + 'd at PayFast.' };
  } catch (err: any) {
    console.error('PayFast ' + action + ' error:', err?.message || err);
    return { ok: false, message: 'Could not reach PayFast.' };
  }
}

export async function pausePayFastSubscription(
  token: string | null,
  cycles: number,
): Promise<PayFastApiResult> {
  if (!token) return { ok: false, message: 'No PayFast subscription on record.' };
  const n = Math.max(1, Math.round(cycles));
  return call(token, 'pause', { cycles: String(n) });
}

export async function unpausePayFastSubscription(
  token: string | null,
): Promise<PayFastApiResult> {
  if (!token) return { ok: false, message: 'No PayFast subscription on record.' };
  return call(token, 'unpause');
}
