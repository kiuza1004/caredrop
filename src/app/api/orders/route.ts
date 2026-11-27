import { NextRequest, NextResponse } from 'next/server';
import { createOrderWithPayment } from '@/lib/settlement-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { buyerUserId, storeId, items, pointToUse, selectedCardId } = body;

    if (!buyerUserId || !storeId || !items || items.length === 0) {
      return NextResponse.json({ error: '주문 정보가 올바르지 않습니다.' }, { status: 400 });
    }

    const result = createOrderWithPayment({
      buyerUserId: parseInt(buyerUserId, 10),
      storeId: parseInt(storeId, 10),
      items,
      pointToUse: pointToUse ? parseInt(pointToUse, 10) : 0,
      selectedCardId: selectedCardId ? parseInt(selectedCardId, 10) : null
    });

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
