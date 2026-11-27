export type UserRole = 'USER' | 'OWNER' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  created_at: string;
}

export interface Store {
  id: number;
  name: string;
  category: string;
  address: string;
  phone: string;
  min_order_amount: number;
  delivery_fee: number;
  logo_url?: string;
  banner_url?: string;
  created_at: string;
}

export interface Menu {
  id: number;
  store_id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  is_popular: boolean;
}

export interface StoreAffiliatePolicy {
  store_id: number;
  is_active: boolean;
  buyer_rate: number;      // 기본 0.010 (1%)
  referrer_rate: number;   // 기본 0.010 (1%)
  original_rate: number;   // 기본 0.010 (1%)
  valid_days: number;      // 기본 30
  updated_at: string;
}

export type CurationType = 'ORDER_SET' | 'PRESET_TAG';

export interface CurationPayload {
  tag?: string;             // 예: "👍 동네 찐맛집"
  menu_ids?: number[];      // 예: [101, 102]
  menu_names?: string[];    // 예: ["바삭 양념치킨", "치즈볼 세트"]
  title?: string;           // 예: "철수's Pick 꿀조합 세트"
}

export interface UserCurationCard {
  card_id: number;
  card_code: string;
  store_id: number;
  owner_user_id: number;
  original_user_id: number | null;
  curation_type: CurationType;
  curation_payload: CurationPayload;
  downline_count: number;
  has_joined_upline: boolean;
  expires_at: string;
  prev_expires_at: string | null;
  created_at: string;
  updated_at: string;
  // Join fields
  owner_name?: string;
  original_name?: string;
  store_name?: string;
  is_expired?: boolean;
}

export interface UserReceivedCard {
  receipt_id: number;
  receiver_user_id: number;
  store_id: number;
  card_id: number;
  received_at: string;
  card?: UserCurationCard;
}

export type OrderStatus = 'PAID' | 'DELIVERED' | 'CANCELED';

export interface Order {
  order_id: number;
  store_id: number;
  buyer_user_id: number;
  order_amount: number;
  applied_card_id: number | null;
  snap_referrer_id: number | null;
  snap_original_id: number | null;
  status: OrderStatus;
  delivered_at: string | null;
  created_at: string;
  // Expanded
  store_name?: string;
  buyer_name?: string;
  items?: OrderItem[];
  payment?: OrderPayment;
}

export interface OrderItem {
  item_id?: number;
  order_id: number;
  menu_id: number;
  menu_name: string;
  price: number;
  quantity: number;
}

export interface OrderPayment {
  payment_id: number;
  order_id: number;
  total_order_amount: number;
  pg_paid_amount: number;
  point_used_amount: number;
  pg_tid: string | null;
  created_at: string;
}

export type PointRoleType = 'BUYER' | 'REFERRER' | 'ORIGINAL' | 'POINT_USE';
export type PointTxType = 'EARN' | 'USE' | 'CANCEL_EARN' | 'CANCEL_USE';
export type PointStatus = 'PENDING' | 'CONFIRMED' | 'CANCELED';

export interface PointLedger {
  ledger_id: number;
  user_id: number;
  order_id: number;
  store_id: number;
  role_type: PointRoleType;
  tx_type: PointTxType;
  amount: number;
  status: PointStatus;
  confirm_due_at: string | null;
  created_at: string;
  // Display
  store_name?: string;
}

export interface CardMatchResult {
  appliedCard: UserCurationCard | null;
  matchCase: 'ALL_VALID' | 'REFERRER_ONLY' | 'ORIGINAL_ONLY' | 'EXPIRED_OR_NONE';
  caseDescription: string;
  buyerRate: number;
  referrerRate: number;
  originalRate: number;
  totalRewardRate: number;
  buyerAmount: number;
  referrerAmount: number;
  originalAmount: number;
  isSelfReferral: boolean;
}

export interface StoreSettlementSummary {
  storeId: number;
  storeName: string;
  totalOrderAmount: number;
  totalPgPaidAmount: number;
  totalPointUsedAmount: number;
  pgFee: number;                // PG 실비 원가 (약 3.0%)
  platformFee: number;          // 플랫폼 중개수수료 (2.5%)
  rewardEarnedAmount: number;   // 본 매장 주문으로 적립된 포인트 (점주 부담)
  crossPointUsedAmount: number; // 타 매장 포인트 교차 사용된 금액 (플랫폼이 점주에게 현금 보전)
  finalSettlementAmount: number;// 최종 점주 정산금
}
