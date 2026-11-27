import { NextRequest, NextResponse } from 'next/server';
import { calculateCardMatching } from '@/lib/card-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { buyerUserId, storeId, orderAmount, selectedCardId } = body;

    if (!buyerUserId || !storeId || !orderAmount) {
      return NextResponse.json({ error: '구매자 ID, 매장 ID, 주문금액이 필요합니다.' }, { status: 400 });
    }

    const matchResult = calculateCardMatching({
      buyerUserId: parseInt(buyerUserId, 10),
      storeId: parseInt(storeId, 10),
      orderAmount: parseInt(orderAmount, 10),
      selectedCardId: selectedCardId ? parseInt(selectedCardId, 10) : null
    });

    return NextResponse.json({ matchResult });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
