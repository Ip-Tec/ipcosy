import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const initSchema = z.object({
  amount: z.number().positive(),
  email: z.string().email(),
  callbackUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parse = initSchema.safeParse(body);

    if (!parse.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { amount, email, callbackUrl } = parse.data;

    const CREDO_SECRET_KEY = process.env.CREDO_SECRET_KEY;
    if (!CREDO_SECRET_KEY) {
      throw new Error('CREDO_SECRET_KEY is not configured');
    }

    // Direct Credo Initialization
    const res = await fetch('https://api.credocentral.com/transaction/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': CREDO_SECRET_KEY,
      },
      body: JSON.stringify({
        amount, // Credo expects amount in kobo
        email,
        callbackUrl: callbackUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/profile`,
        metadata: {
          userId: session.user.id,
          product: 'ipcosy'
        }
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || `Credo init failed: ${res.status}`);
    }

    // Adapt to expecting authorization_url and reference for the frontend
    return NextResponse.json({
      authorization_url: result.data.authorizationUrl,
      reference: result.data.reference
    });
  } catch (error: any) {
    console.error('Payment Init Error:', error);
    return NextResponse.json({ error: error.message || 'Payment initialization failed' }, { status: 500 });
  }
}
