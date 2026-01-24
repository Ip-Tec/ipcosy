import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Adjust path as needed based on structure
import { IpBokGateway } from '@/lib/ipbok-gateway';
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

    // Optional: Validate email matches session email if strict security needed, 
    // but user might pay with different email.

    const result = await IpBokGateway.initializePayment(email, amount, session.user.id, callbackUrl);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Payment Init Error:', error);
    return NextResponse.json({ error: error.message || 'Payment initialization failed' }, { status: 500 });
  }
}
