import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const { paymentId } = params;
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: 'Failure reason is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Payment marked as failed' });
  } catch (error) {
    console.error('[v0] Fail payment error:', error);
    return NextResponse.json(
      { error: 'Failed to mark payment as failed' },
      { status: 500 }
    );
  }
}
