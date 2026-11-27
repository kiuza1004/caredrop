import { getDb } from './db';

console.log('초기 데모 데이터베이스 시딩을 시작합니다...');
const db = getDb();
console.log('✓ CareDrop 데이터베이스 초기화 및 시드 데이터 적재 완료!');
