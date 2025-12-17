import http from 'http';

console.log('🔌 Testing API Connection...');

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/subscribers',
    method: 'GET',
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);

    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('BODY:', data);
        try {
            const parsed = JSON.parse(data);
            console.log('✅ Parsed JSON:', parsed);
            console.log('📊 Count:', parsed.length);
        } catch (e) {
            console.error('❌ Failed to parse JSON');
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Request error: ${e.message}`);
});

req.end();
