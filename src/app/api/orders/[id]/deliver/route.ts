import { NextRequest, NextResponse } from 'next/server';
import { deliverOrder } from '@/lib/settlement-engine';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const orderId = parseInt(params.id, 10);
  const ok = deliverOrder(orderId);
  return NextResponse.json({ success: ok, message: '배달이 완료 처리되었습니다.' });
}
