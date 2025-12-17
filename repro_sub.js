import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001/api';
const TEST_EMAIL = `test_${Date.now()}@example.com`;

async function test() {
    console.log(`🔌 Testing Subscription Flow on ${BASE_URL}...`);

    // 1. Subscribe
    console.log(`\n1️⃣ Subscribing ${TEST_EMAIL}...`);
    try {
        const res = await fetch(`${BASE_URL}/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_EMAIL })
        });
        const data = await res.json();
        console.log(`Response: ${res.status}`, data);
    } catch (err) {
        console.error('Failed to subscribe:', err.message);
    }

    // 2. Fetch Subscribers
    console.log(`\n2️⃣ Fetching Subscribers List...`);
    try {
        const res = await fetch(`${BASE_URL}/subscribers`);
        const subscribers = await res.json();
        console.log(`Response: ${res.status}`);
        console.log(`Subscribers Count: ${subscribers.length}`);
        console.log(`Subscribers List:`, subscribers);

        if (subscribers.includes(TEST_EMAIL)) {
            console.log(`\n✅ SUCCESS: Email found in list!`);
        } else {
            console.log(`\n❌ FAILURE: Email NOT found in list.`);
        }
    } catch (err) {
        console.error('Failed to fetch subscribers:', err.message);
    }
}

test();
