import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storeId = parseInt(params.id, 10);
    const body = await req.json();
    const { isActive, buyerRate, referrerRate, originalRate, validDays } = body;

    const db = getDb();
    const stmt = db.prepare(`
      UPDATE store_affiliate_policies
      SET is_active = ?,
          buyer_rate = ?,
          referrer_rate = ?,
          original_rate = ?,
          valid_days = ?,
          updated_at = datetime('now', 'localtime')
      WHERE store_id = ?
    `);

    stmt.run(
      isActive ? 1 : 0,
      buyerRate ?? 0.010,
      referrerRate ?? 0.010,
      originalRate ?? 0.010,
      validDays ?? 30,
      storeId
    );

    return NextResponse.json({ success: true, message: '제휴 리워드 정책이 변경되었습니다.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
