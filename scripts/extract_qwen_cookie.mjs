import http from 'node:http';
import WebSocket from 'ws';

async function getCDPUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json/version', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.webSocketDebuggerUrl);
        } catch(e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  try {
    const wsUrl = await getCDPUrl();
    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Network.getAllCookies'
      }));
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === 1) {
        const cookies = msg.result.cookies || [];
        const qwenCookies = cookies.filter(c => c.domain.includes('qwen.ai') || c.domain.includes('alicdn.com') || c.domain.includes('alibaba'));
        const cookieHeader = qwenCookies.map(c => `${c.name}=${c.value}`).join('; ');
        console.log('--- EXPACTED QWEN COOKIES ---');
        console.log(cookieHeader);
        ws.close();
        process.exit(0);
      }
    });
  } catch (err) {
    console.error('Error extracting cookies via CDP:', err);
    process.exit(1);
  }
}

main();
