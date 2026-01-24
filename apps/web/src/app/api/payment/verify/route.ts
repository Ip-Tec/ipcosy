import { NextRequest, NextResponse } from 'next/server';
import { IpBokGateway } from '@/lib/ipbok-gateway';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Reference required' }, { status: 400 });
    }

    const result = await IpBokGateway.verifyPayment(reference);
    
    // Here we should also update our local DB if paid: true
    // But per instructions: "IP-Cosy should store its own internal record... only after successful verification"
    // Ideally we do it here.

    if (result.paid) {
        if (result.metadata?.userId) {
            try {
                // Determine source for prisma import. In the monorepo it seems to be @ipcosy/db
                // We need to dynamic import or assume the project structure. 
                // Based on package.json, `@ipcosy/db` is a dependency.
                const { prisma } = await import('@ipcosy/db');
                
                await prisma.user.update({
                    where: { id: result.metadata.userId },
                    data: { isPremium: true }
                });
            } catch (dbErr) {
                console.error('Failed to upgrade user premium status', dbErr);
                // Return success=true still because payment IS successful, but maybe log for support
            }
        } else {
             console.error('Payment verified but no userId in metadata', result);
        }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Payment Verify Error:', error);
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
