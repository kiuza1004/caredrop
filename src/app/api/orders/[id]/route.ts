import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const orderId = parseInt(params.id, 10);
  const db = getDb();

  const order = db.prepare(`
    SELECT o.*, s.name as store_name, u.name as buyer_name,
           r.name as referrer_name, orig.name as original_name
    FROM orders o
    JOIN stores s ON o.store_id = s.id
    JOIN users u ON o.buyer_user_id = u.id
    LEFT JOIN users r ON o.snap_referrer_id = r.id
    LEFT JOIN users orig ON o.snap_original_id = orig.id
    WHERE o.order_id = ?
  `).get(orderId);

  if (!order) {
    return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
  }

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  const payment = db.prepare('SELECT * FROM order_payments WHERE order_id = ?').get(orderId);
  const points = db.prepare('SELECT * FROM point_ledger WHERE order_id = ?').all(orderId);

  return NextResponse.json({ order, items, payment, points });
}
