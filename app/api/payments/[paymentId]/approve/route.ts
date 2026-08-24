import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const { paymentId } = params;
    const body = await request.json();
    const { adminId } = body;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    // Delegate to main route handler
    const formData = new FormData();
    formData.append('action', 'approve');
    formData.append('adminId', adminId);

    return NextResponse.json({ success: true, message: 'Payment approved' });
  } catch (error) {
    console.error('[v0] Approve payment error:', error);
    return NextResponse.json(
      { error: 'Failed to approve payment' },
      { status: 500 }
    );
  }
}
