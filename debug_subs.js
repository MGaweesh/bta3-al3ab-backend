import fetch from 'node-fetch';

async function checkSubscribers() {
    try {
        console.log('Fetching subscribers from http://localhost:3001/api/subscribers...');
        const res = await fetch('http://localhost:3001/api/subscribers');

        if (!res.ok) {
            console.error(`Error: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.error('Body:', text);
            return;
        }

        const data = await res.json();
        console.log('✅ Status: 200 OK');
        console.log('📊 Subscribers Count:', data.length);
        console.log('📝 Data:', JSON.stringify(data, null, 2));

    } catch (err) {
        console.error('❌ Request failed:', err.message);
    }
}

checkSubscribers();
