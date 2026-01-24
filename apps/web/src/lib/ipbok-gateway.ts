import { nanoid } from 'nanoid';

const IP_BOK_URL = process.env.IP_BOK_URL || 'https://ip-bok.vercel.app';
const GATEWAY_KEY = process.env.IPCOSY_GATEWAY_KEY;

export class IpBokGateway {
  static async initializePayment(email: string, amountKc: number, userId: string, callbackUrl?: string) {
    if (!GATEWAY_KEY) {
      throw new Error('IPCOSY_GATEWAY_KEY is not configured');
    }

    const res = await fetch(`${IP_BOK_URL}/api/gateway/ipcosy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ipbok-gateway-key': GATEWAY_KEY,
      },
      body: JSON.stringify({
        amount: amountKc, // amount in kobo
        email,
        callback_url: callbackUrl,
        metadata: {
          userId,
          product: 'ipcosy'
        }
      }),
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || `Gateway init failed: ${res.status}`);
    }

    return res.json() as Promise<{ authorization_url: string; reference: string }>;
  }

  static async verifyPayment(reference: string) {
    if (!GATEWAY_KEY) {
      throw new Error('IPCOSY_GATEWAY_KEY is not configured');
    }

    const res = await fetch(`${IP_BOK_URL}/api/gateway/ipcosy?reference=${reference}`, {
      method: 'GET',
      headers: {
        'x-ipbok-gateway-key': GATEWAY_KEY,
      },
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || `Gateway verify failed: ${res.status}`);
    }

    return res.json() as Promise<{ paid: boolean; reference: string; amount?: number; paidAt?: string; metadata?: any }>;
  }
}
