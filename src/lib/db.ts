import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = path.join(process.cwd(), 'caredrop.sqlite');

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    initDb(dbInstance);
  }
  return dbInstance;
}

function initDb(db: DatabaseSync) {
  // SQLite WAL mode for performance
  db.exec(`PRAGMA journal_mode = WAL;`);

  // 1. Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      email       TEXT UNIQUE NOT NULL,
      phone       TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT 'USER', -- 'USER', 'OWNER', 'ADMIN'
      created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // 2. Stores table
  db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      name              TEXT NOT NULL,
      category          TEXT NOT NULL,
      address           TEXT NOT NULL,
      phone             TEXT NOT NULL,
      min_order_amount  INTEGER NOT NULL DEFAULT 15000,
      delivery_fee      INTEGER NOT NULL DEFAULT 3000,
      logo_url          TEXT,
      banner_url        TEXT,
      created_at        TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // 3. Menus table
  db.exec(`
    CREATE TABLE IF NOT EXISTS menus (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id    INTEGER NOT NULL,
      name        TEXT NOT NULL,
      price       INTEGER NOT NULL,
      description TEXT NOT NULL,
      category    TEXT NOT NULL,
      is_popular  INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );
  `);

  // 4. store_affiliate_policies (제휴 리워드 정책)
  db.exec(`
    CREATE TABLE IF NOT EXISTS store_affiliate_policies (
      store_id      INTEGER PRIMARY KEY,
      is_active     INTEGER NOT NULL DEFAULT 1,
      buyer_rate    REAL NOT NULL DEFAULT 0.010,
      referrer_rate REAL NOT NULL DEFAULT 0.010,
      original_rate REAL NOT NULL DEFAULT 0.010,
      valid_days    INTEGER NOT NULL DEFAULT 30,
      updated_at    TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );
  `);

  // 5. user_curation_cards (큐레이션 카드 / 합체 쿠폰 마스터)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_curation_cards (
      card_id             INTEGER PRIMARY KEY AUTOINCREMENT,
      card_code           TEXT UNIQUE NOT NULL,
      store_id            INTEGER NOT NULL,
      owner_user_id       INTEGER NOT NULL,
      original_user_id    INTEGER NULL,
      curation_type       TEXT NOT NULL, -- 'ORDER_SET', 'PRESET_TAG'
      curation_payload    TEXT NOT NULL, -- JSON string
      downline_count      INTEGER NOT NULL DEFAULT 0,
      has_joined_upline   INTEGER NOT NULL DEFAULT 0,
      expires_at          TEXT NOT NULL,
      prev_expires_at     TEXT NULL,
      created_at          TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at          TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      UNIQUE (owner_user_id, store_id),
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (owner_user_id) REFERENCES users(id),
      FOREIGN KEY (original_user_id) REFERENCES users(id)
    );
  `);

  // 6. user_received_cards (공유받은 카드 후보군 / 클릭 이력)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_received_cards (
      receipt_id          INTEGER PRIMARY KEY AUTOINCREMENT,
      receiver_user_id    INTEGER NOT NULL,
      store_id            INTEGER NOT NULL,
      card_id             INTEGER NOT NULL,
      received_at         TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      UNIQUE (receiver_user_id, card_id),
      FOREIGN KEY (receiver_user_id) REFERENCES users(id),
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (card_id) REFERENCES user_curation_cards(card_id)
    );
  `);

  // 7. orders & order_payments
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id            INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id            INTEGER NOT NULL,
      buyer_user_id       INTEGER NOT NULL,
      order_amount        INTEGER NOT NULL,
      applied_card_id     INTEGER NULL,
      snap_referrer_id    INTEGER NULL,
      snap_original_id    INTEGER NULL,
      status              TEXT NOT NULL DEFAULT 'PAID', -- 'PAID', 'DELIVERED', 'CANCELED'
      delivered_at        TEXT NULL,
      created_at          TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (buyer_user_id) REFERENCES users(id),
      FOREIGN KEY (applied_card_id) REFERENCES user_curation_cards(card_id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      item_id             INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id            INTEGER NOT NULL,
      menu_id             INTEGER NOT NULL,
      menu_name           TEXT NOT NULL,
      price               INTEGER NOT NULL,
      quantity            INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(order_id)
    );

    CREATE TABLE IF NOT EXISTS order_payments (
      payment_id          INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id            INTEGER UNIQUE NOT NULL,
      total_order_amount  INTEGER NOT NULL,
      pg_paid_amount      INTEGER NOT NULL,
      point_used_amount   INTEGER NOT NULL DEFAULT 0,
      pg_tid              TEXT NULL,
      created_at          TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (order_id) REFERENCES orders(order_id)
    );
  `);

  // 8. point_ledger (통합 포인트 원장)
  db.exec(`
    CREATE TABLE IF NOT EXISTS point_ledger (
      ledger_id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id             INTEGER NOT NULL,
      order_id            INTEGER NOT NULL,
      store_id            INTEGER NOT NULL,
      role_type           TEXT NOT NULL, -- 'BUYER', 'REFERRER', 'ORIGINAL', 'POINT_USE'
      tx_type             TEXT NOT NULL, -- 'EARN', 'USE', 'CANCEL_EARN', 'CANCEL_USE'
      amount              INTEGER NOT NULL,
      status              TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'CONFIRMED', 'CANCELED'
      confirm_due_at      TEXT NULL,
      created_at          TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      UNIQUE (order_id, role_type),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (order_id) REFERENCES orders(order_id),
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );
  `);

  // Seed default demo data if empty
  seedDemoData(db);
}

function seedDemoData(db: DatabaseSync) {
  const userCountStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const userCount = (userCountStmt.get() as { count: number }).count;
  if (userCount > 0) return;

  // 1. Seed Users (철수, 영희, 민수 시나리오 페르소나 및 점주들)
  db.exec(`
    INSERT INTO users (id, name, email, phone, role) VALUES
    (1, '철수 (원작자 크리에이터)', 'chulsoo@caredrop.kr', '010-1111-2222', 'USER'),
    (2, '영희 (전달자 크리에이터)', 'younghee@caredrop.kr', '010-3333-4444', 'USER'),
    (3, '민수 (구매자/신규 유입자)', 'minsoo@caredrop.kr', '010-5555-6666', 'USER'),
    (4, '홍길동 점주 (치킨본점)', 'owner1@caredrop.kr', '010-7777-8888', 'OWNER'),
    (5, '이순신 점주 (피자파스타)', 'owner2@caredrop.kr', '010-9999-0000', 'OWNER'),
    (6, 'CareDrop 플랫폼 관리자', 'admin@caredrop.kr', '010-1234-5678', 'ADMIN');
  `);

  // 2. Seed Stores
  db.exec(`
    INSERT INTO stores (id, name, category, address, phone, min_order_amount, delivery_fee, logo_url, banner_url) VALUES
    (1, '황금올리브 바삭치킨 본점', '치킨/안주', '서울시 강남구 테헤란로 123', '02-1234-5678', 15000, 3000, '🍗', 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80'),
    (2, '화덕피자 & 파스타 동네맛집', '피자/양식', '서울시 강남구 역삼로 456', '02-8765-4321', 16000, 2500, '🍕', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80');
  `);

  // 3. Seed Menus
  db.exec(`
    INSERT INTO menus (id, store_id, name, price, description, category, is_popular) VALUES
    (101, 1, '황금 시그니처 바삭 후라이드', 20000, '국내산 냉장 신선육으로 튀겨낸 겉바속촉 극강의 시그니처 치킨', '메인 치킨', 1),
    (102, 1, '매콤달콤 황금 양념치킨', 21000, '전통 비법 소스로 버무린 매콤달콤한 인기 만점 양념치킨', '메인 치킨', 1),
    (103, 1, '모짜렐라 치즈볼 (5개)', 5000, '쫀득한 찹쌀 피 속에 자연산 모짜렐라 치즈가 듬뿍!', '사이드', 1),
    (104, 1, '시원한 제로콜라 1.25L', 2500, '부담 없이 시원하게 즐기는 제로 펩시', '음료', 0),
    (201, 2, '정통 콰트로 마르게리타 피자', 22000, '이탈리아 카푸토 밀가루와 생모짜렐라, 바질의 환상 조합', '화덕 피자', 1),
    (202, 2, '진한 트러플 크림 파스타', 16000, '이탈리아산 블랙 트러플 오일의 깊은 풍미를 담은 크림 파스타', '파스타', 1),
    (203, 2, '갈릭 버터 감자튀김', 6000, '달콤한 갈릭 소스와 버터 풍미의 바삭 감자', '사이드', 0);
  `);

  // 4. Seed Affiliate Policies (초기 1%씩 3% 리워드, 30일 유효)
  db.exec(`
    INSERT INTO store_affiliate_policies (store_id, is_active, buyer_rate, referrer_rate, original_rate, valid_days) VALUES
    (1, 1, 0.010, 0.010, 0.010, 30),
    (2, 1, 0.010, 0.010, 0.010, 30);
  `);

  // 5. Seed Initial Cards for Demo Flow
  // 철수의 원작 카드: 치킨+치즈볼 꿀조합 세트 (유효기간: 현재부터 +30일)
  const chulsooPayload = JSON.stringify({
    title: "철수의 Pick 꿀조합 바삭세트",
    tag: "🍺 야식·안주 최고",
    menu_ids: [101, 103],
    menu_names: ["황금 시그니처 바삭 후라이드", "모짜렐라 치즈볼 (5개)"]
  });

  const insertCardStmt = db.prepare(`
    INSERT INTO user_curation_cards (
      card_id, card_code, store_id, owner_user_id, original_user_id, curation_type,
      curation_payload, downline_count, has_joined_upline, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+30 days'))
  `);

  insertCardStmt.run(
    1, 'CHULSOO77', 1, 1, null, 'ORDER_SET',
    chulsooPayload, 1, 0
  );

  // 영희의 인용 합체 카드 (철수 카드를 인용하여 영희가 만든 [철수 추천 × 영희 추천] 합체 카드)
  const youngheePayload = JSON.stringify({
    title: "철수 추천 × 영희 찐추천 합체 세트",
    tag: "👍 동네 찐맛집 강추",
    menu_ids: [101, 103],
    menu_names: ["황금 시그니처 바삭 후라이드", "모짜렐라 치즈볼 (5개)"]
  });

  insertCardStmt.run(
    2, 'YOUNGHEE88', 1, 2, 1, 'ORDER_SET',
    youngheePayload, 0, 0
  );

  // 민수가 영희의 합체 카드(2) 및 철수의 단독 카드(1)를 모두 수신한 이력 생성
  db.exec(`
    INSERT INTO user_received_cards (receiver_user_id, store_id, card_id) VALUES
    (3, 1, 2),
    (3, 1, 1);
  `);

  // 피자집(Store 2)에서 민수가 이전에 적립받은 가용 포인트 5,000P 보유 시나리오를 위한 과거 완료 주문 및 포인트 원장
  db.exec(`
    INSERT INTO orders (order_id, store_id, buyer_user_id, order_amount, status, delivered_at, created_at)
    VALUES (999, 2, 3, 22000, 'DELIVERED', datetime('now', '-3 days'), datetime('now', '-3 days'));

    INSERT INTO order_payments (order_id, total_order_amount, pg_paid_amount, point_used_amount)
    VALUES (999, 22000, 22000, 0);

    -- 5,000 포인트 CONFIRMED 상태로 민수에게 적립되어 있음 (타 매장 교차 결제 테스트용)
    INSERT INTO point_ledger (user_id, order_id, store_id, role_type, tx_type, amount, status, created_at)
    VALUES (3, 999, 2, 'BUYER', 'EARN', 5000, 'CONFIRMED', datetime('now', '-3 days'));
  `);
}
