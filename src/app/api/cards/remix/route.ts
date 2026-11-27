import { NextRequest, NextResponse } from 'next/server';
import { quoteAndRemixCard } from '@/lib/card-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ownerUserId, parentCardId } = body;

    if (!ownerUserId || !parentCardId) {
      return NextResponse.json({ error: '소유자 ID와 원본 카드 ID가 필요합니다.' }, { status: 400 });
    }

    const result = quoteAndRemixCard(ownerUserId, parentCardId);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
