/**
 * Deployment Verification Script
 * Run this to test your deployment before going live
 *
 * Usage: node test-deployment.js https://your-project.vercel.app
 */

import https from 'https';
import http from 'http';

const baseUrl = process.argv[2] || 'http://localhost:3000';
const isHttps = baseUrl.startsWith('https');
const httpModule = isHttps ? https : http;

console.log('🧪 Testing deployment at:', baseUrl);
console.log('='.repeat(50));

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  return fn()
    .then(() => {
      passedTests++;
      console.log(`✅ ${name}`);
    })
    .catch((err) => {
      console.log(`❌ ${name}`);
      console.log(`   Error: ${err.message}`);
    });
}

function fetch(path) {
  return new Promise((resolve, reject) => {
    const url = `${baseUrl}${path}`;
    const request = httpModule.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });
    request.on('error', reject);
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function runTests() {
  // Test 1: Health check
  await test('Health check endpoint', async () => {
    const res = await fetch('/health');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = JSON.parse(res.body);
    if (json.status !== 'ok') throw new Error('Health check failed');
  });

  // Test 2: Profile endpoint returns SVG
  await test('Profile endpoint returns SVG', async () => {
    const res = await fetch('/api/profile?username=octocat');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.headers['content-type'] !== 'image/svg+xml') {
      throw new Error(`Wrong content-type: ${res.headers['content-type']}`);
    }
    if (!res.body.includes('<svg')) throw new Error('Response is not SVG');
  });

  // Test 3: Dark theme
  await test('Dark theme works', async () => {
    const res = await fetch('/api/profile?username=octocat&theme=dark');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.includes('<svg')) throw new Error('No SVG in response');
  });

  // Test 4: Light theme
  await test('Light theme works', async () => {
    const res = await fetch('/api/profile?username=octocat&theme=light');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // Test 5: Dracula theme
  await test('Dracula theme works', async () => {
    const res = await fetch('/api/profile?username=octocat&theme=dracula');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // Test 6: Nord theme
  await test('Nord theme works', async () => {
    const res = await fetch('/api/profile?username=octocat&theme=nord');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // Test 7: Tokyo Night theme
  await test('Tokyo Night theme works', async () => {
    const res = await fetch('/api/profile?username=octocat&theme=tokyonight');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // Test 8: Monokai theme
  await test('Monokai theme works', async () => {
    const res = await fetch('/api/profile?username=octocat&theme=monokai');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // Test 9: Gruvbox theme
  await test('Gruvbox theme works', async () => {
    const res = await fetch('/api/profile?username=octocat&theme=gruvbox');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // Test 10: Aurora theme
  await test('Aurora theme works', async () => {
    const res = await fetch('/api/profile?username=octocat&theme=aurora');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // Test 11: Midnight Sunset theme
  await test('Midnight Sunset theme works', async () => {
    const res = await fetch('/api/profile?username=octocat&theme=midnight-sunset');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // Test 12: LeetCode parameter
  await test('LeetCode parameter works', async () => {
    const res = await fetch('/api/profile?username=octocat&leetcode=uwi');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // Test 13: LeetCode disabled
  await test('LeetCode=false works', async () => {
    const res = await fetch('/api/profile?username=octocat&leetcode=false');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // Test 14: Left alignment
  await test('Left alignment works', async () => {
    const res = await fetch('/api/profile?username=octocat&align=left');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // Test 15: Center alignment
  await test('Center alignment works', async () => {
    const res = await fetch('/api/profile?username=octocat&align=center');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // Test 16: Right alignment
  await test('Right alignment works', async () => {
    const res = await fetch('/api/profile?username=octocat&align=right');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // Test 17: Cache headers
  await test('Cache headers present', async () => {
    const res = await fetch('/api/profile?username=octocat');
    if (!res.headers['cache-control']) {
      throw new Error('No cache-control header');
    }
  });

  // Test 18: Complex query
  await test('Complex query works', async () => {
    const res = await fetch(
      '/api/profile?username=octocat&theme=dracula&leetcode=false&align=center'
    );
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // Results
  console.log('='.repeat(50));
  console.log(`\n📊 Results: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Ready to deploy! 🚀\n');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${totalTests - passedTests} test(s) failed. Fix issues before deploying.\n`);
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err.message);
  process.exit(1);
});
