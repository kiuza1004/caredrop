import { NextRequest, NextResponse } from 'next/server';
import { cancelOrder } from '@/lib/settlement-engine';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const orderId = parseInt(params.id, 10);
  const result = cancelOrder(orderId);
  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }
  return NextResponse.json(result);
}
