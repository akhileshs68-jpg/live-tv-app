import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const { paymentId } = params;

    return NextResponse.json({ success: true, message: 'Payment cancelled' });
  } catch (error) {
    console.error('[v0] Cancel payment error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel payment' },
      { status: 500 }
    );
  }
}
