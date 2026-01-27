import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ipcosy/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Reference required' }, { status: 400 });
    }

    const CREDO_SECRET_KEY = process.env.CREDO_SECRET_KEY;
    if (!CREDO_SECRET_KEY) {
      throw new Error('CREDO_SECRET_KEY is not configured');
    }

    // Direct Credo Verification
    const res = await fetch(`https://api.credocentral.com/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': CREDO_SECRET_KEY,
      },
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || `Credo verify failed: ${res.status}`);
    }

    const data = result.data;
    const isPaid = data.status === 0 || data.status === '0'; // Credo status 0 is success

    if (isPaid) {
        const userId = data.metadata?.userId;
        if (userId) {
            try {
                await prisma.user.update({
                    where: { id: userId },
                    data: { isPremium: true }
                });
            } catch (dbErr) {
                console.error('Failed to upgrade user premium status', dbErr);
            }
        }
    }

    return NextResponse.json({
        paid: isPaid,
        reference: data.reference,
        amount: data.amount,
        metadata: data.metadata
    });
  } catch (error: any) {
    console.error('Payment Verify Error:', error);
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
