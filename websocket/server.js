const WebSocket = require('ws');

// Membuat server pada port 8081
const wss = new WebSocket.Server({ port: 8081 });

console.log('🚀 WebSocket Server berjalan di ws://localhost:8081');

wss.on('connection', function connection(ws) {
    console.log('✅ Klien baru terhubung!');

    ws.on('message', function incoming(message) {
        const messageStr = message.toString();

        try {
            // Change message to JSON
            const parsedMessage = JSON.parse(messageStr);
        
            // 1. Check PING
            if (parsedMessage.type === 'ping') {
                // Send PONG back to client
                ws.send(JSON.stringify({
                    type: "pong",
                    timestamp: parsedMessage.timestamp
                }));
                return; // Stop further processing
            }

            // 2. Check if message is from Python (emotion data)
            wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(messageStr);
                }
            });
        } catch (error) {
            // If message is not JSON, just broadcast it as is (for backward compatibility)
            wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(messagegStr);
                }
            });
        }
    });

    ws.on('close', () => {
        console.log('❌ Klien terputus.');
    });
});