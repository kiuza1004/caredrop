import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const stores = db.prepare(`
    SELECT s.*, p.is_active as policy_active, p.buyer_rate, p.referrer_rate, p.original_rate
    FROM stores s
    LEFT JOIN store_affiliate_policies p ON s.id = p.store_id
    ORDER BY s.id ASC
  `).all();

  return NextResponse.json({ stores });
}
