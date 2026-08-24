import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const { paymentId } = params;
    const body = await request.json();
    const { adminId, reason } = body;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Payment rejected' });
  } catch (error) {
    console.error('[v0] Reject payment error:', error);
    return NextResponse.json(
      { error: 'Failed to reject payment' },
      { status: 500 }
    );
  }
}
