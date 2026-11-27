import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
const tempDir = path.join(process.cwd(), 'src', '_temp_api');

console.log('GitHub Pages용 정적 내보내기 빌드를 준비합니다...');

let moved = false;
if (fs.existsSync(apiDir)) {
  fs.renameSync(apiDir, tempDir);
  moved = true;
}

try {
  process.env.GITHUB_PAGES = 'true';
  console.log('Next.js 정적 빌드(output: export, basePath: /caredrop) 실행 중...');
  execSync('npx next build', { stdio: 'inherit', env: { ...process.env, GITHUB_PAGES: 'true' } });
  console.log('✓ GitHub Pages 정적 빌드 완료 (./out)');
} finally {
  if (moved && fs.existsSync(tempDir)) {
    fs.renameSync(tempDir, apiDir);
    console.log('✓ API 라우트 정상 복원 완료');
  }
}
