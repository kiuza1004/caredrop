import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const storeId = parseInt(params.id, 10);
  const db = getDb();

  const store = db.prepare(`
    SELECT s.*, p.is_active as policy_active, p.buyer_rate, p.referrer_rate, p.original_rate
    FROM stores s
    LEFT JOIN store_affiliate_policies p ON s.id = p.store_id
    WHERE s.id = ?
  `).get(storeId);

  if (!store) {
    return NextResponse.json({ error: '매장을 찾을 수 없습니다.' }, { status: 404 });
  }

  const menus = db.prepare(`
    SELECT * FROM menus WHERE store_id = ? ORDER BY is_popular DESC, id ASC
  `).all(storeId);

  return NextResponse.json({ store, menus });
}
