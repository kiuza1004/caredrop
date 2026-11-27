import { NextRequest, NextResponse } from 'next/server';
import { createCurationCard } from '@/lib/card-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId, ownerUserId, curationType, curationPayload, originalUserId, customCode } = body;

    if (!storeId || !ownerUserId || !curationType || !curationPayload) {
      return NextResponse.json({ error: '필수 입력값이 누락되었습니다.' }, { status: 400 });
    }

    const card = createCurationCard({
      storeId,
      ownerUserId,
      curationType,
      curationPayload,
      originalUserId,
      customCode
    });

    return NextResponse.json({ success: true, card });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
