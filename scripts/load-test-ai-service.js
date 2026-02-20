const SERVICE_URL = 'http://localhost:3002';

async function main() {
  console.log('Starting load test...');

  // Test Health
  try {
    const res = await fetch(`${SERVICE_URL}/health`);
    console.log('Health check:', res.status, await res.json());
  } catch (e) {
    console.error('Health check failed:', e.message);
    process.exit(1);
  }

  // Generate some traffic to populate metrics
  console.log('Sending traffic...');
  for (let i = 0; i < 10; i++) {
    try {
      await fetch(`${SERVICE_URL}/health`, {
        headers: {
            'X-Request-ID': `load-test-${i}`
        }
      });
    } catch (e) {
        console.error(`Request ${i} failed:`, e.message);
    }
  }

  // Check Metrics
  try {
    const res = await fetch(`${SERVICE_URL}/metrics`);
    const text = await res.text();
    console.log('Metrics retrieved. Length:', text.length);

    const expectedMetrics = [
        'http_request_duration_seconds',
        'process_cpu_user_seconds_total',
        'process_resident_memory_bytes',
        'queue_depth'
    ];

    let allFound = true;
    for (const metric of expectedMetrics) {
        if (text.includes(metric)) {
            console.log(`PASS: Found metric ${metric}`);
        } else {
            console.error(`FAIL: Missing metric ${metric}`);
            allFound = false;
        }
    }

    if (!allFound) {
        console.error('Some metrics are missing.');
        process.exit(1);
    }

  } catch (e) {
    console.error('Metrics check failed:', e.message);
    process.exit(1);
  }

  console.log('Load test completed successfully.');
}

main();
