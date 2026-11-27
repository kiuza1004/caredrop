import { NextRequest, NextResponse } from 'next/server';
import { receiveAndTrackCard } from '@/lib/card-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { receiverUserId, cardCode } = body;

    if (!receiverUserId || !cardCode) {
      return NextResponse.json({ error: '수신 유저 ID와 카드 코드가 필요합니다.' }, { status: 400 });
    }

    const result = receiveAndTrackCard(receiverUserId, cardCode);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
