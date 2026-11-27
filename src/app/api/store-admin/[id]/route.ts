import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculateStoreSettlement } from '@/lib/settlement-engine';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const storeId = parseInt(params.id, 10);
  const db = getDb();

  const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(storeId);
  if (!store) {
    return NextResponse.json({ error: '매장을 찾을 수 없습니다.' }, { status: 404 });
  }

  const policy = db.prepare('SELECT * FROM store_affiliate_policies WHERE store_id = ?').get(storeId);
  const settlement = calculateStoreSettlement(storeId);

  // 최근 주문 목록
  const orders = db.prepare(`
    SELECT o.*, u.name as buyer_name, p.pg_paid_amount, p.point_used_amount, p.pg_tid
    FROM orders o
    JOIN users u ON o.buyer_user_id = u.id
    LEFT JOIN order_payments p ON o.order_id = p.order_id
    WHERE o.store_id = ?
    ORDER BY o.created_at DESC
  `).all(storeId);

  // 이 매장에서 발급된 활성 카드 목록
  const cards = db.prepare(`
    SELECT c.*, u.name as owner_name, orig.name as original_name
    FROM user_curation_cards c
    JOIN users u ON c.owner_user_id = u.id
    LEFT JOIN users orig ON c.original_user_id = orig.id
    WHERE c.store_id = ?
    ORDER BY c.created_at DESC
  `).all(storeId).map((row: any) => ({
    ...row,
    curation_payload: typeof row.curation_payload === 'string' ? JSON.parse(row.curation_payload) : row.curation_payload,
    is_expired: new Date(row.expires_at) <= new Date()
  }));

  return NextResponse.json({
    store,
    policy,
    settlement,
    orders,
    cards
  });
}
