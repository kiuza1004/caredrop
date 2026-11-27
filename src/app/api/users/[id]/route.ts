import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserPointBalance } from '@/lib/settlement-engine';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = parseInt(params.id, 10);
  const db = getDb();

  const user = db.prepare('SELECT id, name, email, phone, role FROM users WHERE id = ?').get(userId);
  if (!user) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }

  // 포인트 잔액
  const points = getUserPointBalance(userId);

  // 내가 만든 카드 목록
  const myCards = db.prepare(`
    SELECT c.*, s.name as store_name, o.name as original_name
    FROM user_curation_cards c
    JOIN stores s ON c.store_id = s.id
    LEFT JOIN users o ON c.original_user_id = o.id
    WHERE c.owner_user_id = ?
    ORDER BY c.created_at DESC
  `).all(userId).map((row: any) => ({
    ...row,
    curation_payload: typeof row.curation_payload === 'string' ? JSON.parse(row.curation_payload) : row.curation_payload,
    is_expired: new Date(row.expires_at) <= new Date()
  }));

  // 내가 수신한(공유받은) 카드 목록
  const receivedCards = db.prepare(`
    SELECT r.receipt_id, r.received_at, c.*, s.name as store_name, u.name as owner_name, o.name as original_name
    FROM user_received_cards r
    JOIN user_curation_cards c ON r.card_id = c.card_id
    JOIN stores s ON c.store_id = s.id
    JOIN users u ON c.owner_user_id = u.id
    LEFT JOIN users o ON c.original_user_id = o.id
    WHERE r.receiver_user_id = ?
    ORDER BY r.received_at DESC
  `).all(userId).map((row: any) => ({
    ...row,
    curation_payload: typeof row.curation_payload === 'string' ? JSON.parse(row.curation_payload) : row.curation_payload,
    is_expired: new Date(row.expires_at) <= new Date()
  }));

  // 주문 내역
  const orders = db.prepare(`
    SELECT o.*, s.name as store_name, p.pg_paid_amount, p.point_used_amount
    FROM orders o
    JOIN stores s ON o.store_id = s.id
    LEFT JOIN order_payments p ON o.order_id = p.order_id
    WHERE o.buyer_user_id = ?
    ORDER BY o.created_at DESC
  `).all(userId);

  // 포인트 원장 내역
  const pointLedger = db.prepare(`
    SELECT l.*, s.name as store_name
    FROM point_ledger l
    LEFT JOIN stores s ON l.store_id = s.id
    WHERE l.user_id = ?
    ORDER BY l.created_at DESC
  `).all(userId);

  return NextResponse.json({
    user,
    points,
    myCards,
    receivedCards,
    orders,
    pointLedger
  });
}
