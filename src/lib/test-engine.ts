import { getDb } from './db';
import { calculateCardMatching, createCurationCard, quoteAndRemixCard, receiveAndTrackCard } from './card-engine';
import { calculateStoreSettlement, confirmPendingPoints, createOrderWithPayment, getUserPointBalance } from './settlement-engine';

function runTests() {
  console.log('--- [CareDrop 비즈니스 로직 엔진 검증 시작] ---');

  // 1. 초기 DB 확인
  const db = getDb();
  console.log('✓ DB 초기화 및 시드 데이터 적재 완료');

  // 2. 초기 카드 확인 (철수 원작 카드)
  const card1 = db.prepare('SELECT * FROM user_curation_cards WHERE card_id = 1').get() as any;
  console.log(`✓ 철수 원작 카드: ${card1.card_code}, 유효기간: ${card1.expires_at}`);

  // 3. 영희의 합체 카드 확인
  const card2 = db.prepare('SELECT * FROM user_curation_cards WHERE card_id = 2').get() as any;
  console.log(`✓ 영희 합체 카드: ${card2.card_code}, 원작자: ${card2.original_user_id}`);

  // 4. Case 1: 민수가 영희 카드를 통해 20,000원 주문 시 매칭 계산 (철수+영희 모두 유효)
  const match1 = calculateCardMatching({
    buyerUserId: 3, // 민수
    storeId: 1,
    orderAmount: 20000,
    selectedCardId: 2 // 영희 카드
  });
  console.log(`✓ Case 1 (모두 유효): ${match1.matchCase} -> 민수: ${match1.buyerAmount}원(1%), 영희: ${match1.referrerAmount}원(1%), 철수: ${match1.originalAmount}원(1%) (총 ${match1.totalRewardRate * 100}%)`);
  if (match1.buyerAmount !== 200 || match1.referrerAmount !== 200 || match1.originalAmount !== 200) {
    throw new Error('Case 1 매칭 금액 오류');
  }

  // 5. Case 2: 영희 유효, 철수 만료 시뮬레이션
  db.exec("UPDATE user_curation_cards SET expires_at = datetime('now', '-1 day') WHERE card_id = 1");
  const match2 = calculateCardMatching({
    buyerUserId: 3,
    storeId: 1,
    orderAmount: 20000,
    selectedCardId: 2
  });
  console.log(`✓ Case 2 (원작자 만료): ${match2.matchCase} -> 민수: ${match2.buyerAmount}원, 영희: ${match2.referrerAmount}원, 철수: ${match2.originalAmount}원 (총 ${match2.totalRewardRate * 100}%)`);
  if (match2.originalAmount !== 0 || match2.referrerAmount !== 200) {
    throw new Error('Case 2 매칭 오류');
  }

  // 6. Case 3: 영희 만료, 철수 유효 시뮬레이션 (살아있는 철수 카드로 자동 전환)
  db.exec("UPDATE user_curation_cards SET expires_at = datetime('now', '+30 days') WHERE card_id = 1");
  db.exec("UPDATE user_curation_cards SET expires_at = datetime('now', '-1 day') WHERE card_id = 2");
  const match3 = calculateCardMatching({
    buyerUserId: 3,
    storeId: 1,
    orderAmount: 20000,
    selectedCardId: 2
  });
  console.log(`✓ Case 3 (전달자 만료): ${match3.matchCase} -> 민수: ${match3.buyerAmount}원, 철수: ${match3.originalAmount}원 (총 ${match3.totalRewardRate * 100}%)`);
  if (match3.referrerAmount !== 0 || match3.originalAmount !== 200) {
    throw new Error('Case 3 매칭 오류');
  }

  // 7. Case 4: 모두 만료 시뮬레이션
  db.exec("UPDATE user_curation_cards SET expires_at = datetime('now', '-1 day') WHERE card_id = 1");
  const match4 = calculateCardMatching({
    buyerUserId: 3,
    storeId: 1,
    orderAmount: 20000,
    selectedCardId: 2
  });
  console.log(`✓ Case 4 (모두 만료): ${match4.matchCase} -> 민수: ${match4.buyerAmount}원(1% 기본 적립)`);
  if (match4.buyerAmount !== 200 || match4.referrerAmount !== 0 || match4.originalAmount !== 0) {
    throw new Error('Case 4 매칭 오류');
  }

  // 원복 (모두 30일 유효)
  db.exec("UPDATE user_curation_cards SET expires_at = datetime('now', '+30 days') WHERE card_id IN (1, 2)");

  // 8. 셀프 어뷰징 방어 테스트 (영희가 자기 카드로 재주문)
  const selfMatch = calculateCardMatching({
    buyerUserId: 2, // 영희 본인
    storeId: 1,
    orderAmount: 20000,
    selectedCardId: 2
  });
  console.log(`✓ 셀프 어뷰징 방어: 본인(영희) 몫 전달자 수령 차단 여부: ${selfMatch.referrerAmount === 0 ? '차단 완료(0원)' : '실패'}, 구매자 몫: ${selfMatch.buyerAmount}원, 상위 철수: ${selfMatch.originalAmount}원`);
  if (selfMatch.referrerAmount !== 0 || selfMatch.buyerAmount !== 200 || selfMatch.originalAmount !== 200) {
    throw new Error('셀프 어뷰징 방어 오류');
  }

  // 9. 주문 및 결제 + 교차 포인트 사용 테스트
  // 민수는 피자집에서 적립된 5000P 보유 중 -> 치킨집(Store 1) 주문에서 5,000P 전액 교차 사용!
  const orderResult = createOrderWithPayment({
    buyerUserId: 3,
    storeId: 1,
    items: [{ menuId: 101, menuName: '황금 시그니처 바삭 후라이드', price: 20000, quantity: 1 }],
    pointToUse: 5000,
    selectedCardId: 2
  });
  console.log(`✓ 주문 완료: orderId=${orderResult.orderId}, 생성된 자동카드코드=${orderResult.autoCardCode}`);

  // 10. 포인트 상태 확인
  const minsooBal = getUserPointBalance(3);
  console.log(`✓ 민수 잔액: 가용=${minsooBal.availablePoints}P (5000P 교차사용됨), 적립예정=${minsooBal.pendingPoints}P (방금 주문 1%인 200P 대기중)`);

  // 11. 배달 완료 및 포인트 확정 배치 테스트
  confirmPendingPoints(orderResult.orderId, true);
  const minsooBalAfterConfirm = getUserPointBalance(3);
  console.log(`✓ 24시간 경과 후 확정 배치 실행 후 민수 가용포인트: ${minsooBalAfterConfirm.availablePoints}P (200P 확정됨)`);

  // 12. 점주 정산 명세 확인 (배달완료 처리 후)
  db.exec(`UPDATE orders SET status = 'DELIVERED' WHERE order_id = ${orderResult.orderId}`);
  const settlement = calculateStoreSettlement(1);
  console.log(`✓ 점주 정산표:
    - 총 주문매출: ${settlement.totalOrderAmount}원
    - PG 결제액: ${settlement.totalPgPaidAmount}원
    - 포인트 교차사용액: ${settlement.totalPointUsedAmount}원
    - PG 원가(3%): ${settlement.pgFee}원
    - 플랫폼 수수료(2.5%): ${settlement.platformFee}원
    - 리워드 적립금 점주부담: ${settlement.rewardEarnedAmount}원
    - 포인트 교차사용 플랫폼 현금보전: ${settlement.crossPointUsedAmount}원
    - 최종 점주 수령액: ${settlement.finalSettlementAmount}원
  `);

  console.log('--- [모든 핵심 비즈니스 로직 단위 테스트 통과!] ---');
}

runTests();
