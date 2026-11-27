import { NextRequest, NextResponse } from 'next/server';
import { confirmPendingPoints } from '@/lib/settlement-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId, forceImmediate } = body;

    const count = confirmPendingPoints(orderId, forceImmediate !== false);
    return NextResponse.json({
      success: true,
      confirmedCount: count,
      message: `${count}건의 포인트가 성공적으로 확정(CONFIRMED) 처리되었습니다.`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
