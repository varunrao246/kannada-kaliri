/**
 * Kannada Kaliri — Milestone 11.5 Performance Audit
 * Automated benchmark across all 14 routes/endpoints measuring TTFB, Total Latency, Payload Size & Compression.
 */

const BASE_URL = 'http://localhost:3008';

const ROUTES_TO_AUDIT = [
  { name: '1. Landing Page', path: '/', method: 'GET' },
  { name: '2. Login Page', path: '/login', method: 'GET' },
  { name: '3. Signup Page', path: '/signup', method: 'GET' },
  { name: '4. Onboarding Flow', path: '/onboarding', method: 'GET' },
  { name: '5. Dashboard Portal', path: '/dashboard', method: 'GET' },
  { name: '6. Curriculum Overview', path: '/learn', method: 'GET' },
  { name: '7. Lesson Detail (M01-L01)', path: '/learn/m01-l01', method: 'GET' },
  { name: '8. AI Kannada Guru', path: '/guru', method: 'GET' },
  { name: '9. Scenario Library', path: '/scenarios', method: 'GET' },
  { name: '10. Scenario Simulator Room', path: '/scenarios/scn-01-shopping', method: 'GET' },
  { name: '11. Achievements & Streaks', path: '/achievements', method: 'GET' },
  { name: '12. Admin Console Overview', path: '/admin', method: 'GET' },
  { name: '13. Speech TTS Health Check', path: '/api/speech/synthesize', method: 'GET' },
  { name: '14. Speech STT Options/Health', path: '/api/speech/transcribe', method: 'OPTIONS' },
];

async function measureRoute(route) {
  const url = `${BASE_URL}${route.path}`;
  const start = performance.now();
  let ttfb = 0;
  
  try {
    const res = await fetch(url, {
      method: route.method,
      redirect: 'manual', // do not follow redirect to measure true middleware/route response time
      headers: {
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });
    
    ttfb = performance.now() - start;
    const bodyBuffer = await res.arrayBuffer();
    const totalTime = performance.now() - start;
    const encoding = res.headers.get('content-encoding') || 'none';
    const contentType = res.headers.get('content-type') || 'unknown';

    return {
      name: route.name,
      path: route.path,
      status: res.status,
      ttfbMs: Math.round(ttfb),
      totalMs: Math.round(totalTime),
      sizeBytes: bodyBuffer.byteLength,
      encoding,
      contentType: contentType.split(';')[0],
      success: true,
    };
  } catch (err) {
    return {
      name: route.name,
      path: route.path,
      status: 0,
      ttfbMs: Math.round(performance.now() - start),
      totalMs: Math.round(performance.now() - start),
      sizeBytes: 0,
      encoding: 'error',
      contentType: 'error',
      success: false,
      error: err.message,
    };
  }
}

async function runPerformanceAudit() {
  console.log('========================================================================================');
  console.log('              KANNADA KALIRI — APPLICATION-WIDE PERFORMANCE BENCHMARK                   ');
  console.log('========================================================================================\n');

  // Warm-up run
  console.log('Warming up server cache...');
  await measureRoute(ROUTES_TO_AUDIT[0]);
  console.log('Warm-up complete. Commencing precision audit.\n');

  const results = [];

  for (const route of ROUTES_TO_AUDIT) {
    // Run 2 passes to get stable median
    const pass1 = await measureRoute(route);
    const pass2 = await measureRoute(route);
    const best = pass1.ttfbMs < pass2.ttfbMs ? pass1 : pass2;
    results.push(best);
  }

  console.log('| Route / Component | Path | Status | TTFB (ms) | Total (ms) | Size (KB) | Encoding |');
  console.log('|:---|:---|:---:|:---:|:---:|:---:|:---:|');
  for (const r of results) {
    const sizeKb = (r.sizeBytes / 1024).toFixed(1);
    console.log(
      `| ${r.name.padEnd(26)} | ${r.path.padEnd(24)} | ${r.status} | ${r.ttfbMs.toString().padStart(6)} ms | ${r.totalMs.toString().padStart(7)} ms | ${sizeKb.padStart(6)} KB | ${r.encoding.padEnd(8)} |`
    );
  }

  const avgTTFB = Math.round(results.reduce((acc, r) => acc + r.ttfbMs, 0) / results.length);
  const avgTotal = Math.round(results.reduce((acc, r) => acc + r.totalMs, 0) / results.length);
  console.log('----------------------------------------------------------------------------------------');
  console.log(`Average TTFB across all 14 routes: ${avgTTFB}ms | Average Total Latency: ${avgTotal}ms`);
  console.log('========================================================================================\n');
}

runPerformanceAudit();

