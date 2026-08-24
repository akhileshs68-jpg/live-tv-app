import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const { paymentId } = params;
    const body = await request.json();
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Payment completed' });
  } catch (error) {
    console.error('[v0] Complete payment error:', error);
    return NextResponse.json(
      { error: 'Failed to complete payment' },
      { status: 500 }
    );
  }
}
