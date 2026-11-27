import { NextRequest, NextResponse } from 'next/server';
import { getCardByCode, receiveAndTrackCard } from '@/lib/card-engine';
import { getDb } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code;
  const searchParams = req.nextUrl.searchParams;
  const currentUserId = searchParams.get('userId');

  const card = getCardByCode(code);
  if (!card) {
    return NextResponse.json({ error: '존재하지 않는 큐레이션 카드입니다.' }, { status: 404 });
  }

  // 사용자가 로그인되어 있고 본인 카드가 아니라면 클릭 유입 자동 추적 및 +30일 연장!
  if (currentUserId) {
    receiveAndTrackCard(parseInt(currentUserId, 10), code);
  }

  // 매장 정보 및 추천 메뉴 상세 정보 가져오기
  const db = getDb();
  const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(card.store_id) as any;

  let menuItems: any[] = [];
  if (card.curation_payload?.menu_ids && card.curation_payload.menu_ids.length > 0) {
    const ids = card.curation_payload.menu_ids.join(',');
    menuItems = db.prepare(`SELECT * FROM menus WHERE id IN (${ids})`).all();
  }

  return NextResponse.json({ card, store, menuItems });
}
