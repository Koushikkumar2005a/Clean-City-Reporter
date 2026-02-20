const { exec } = require('child_process');
const net = require('net');

const PORT = process.env.PORT || 5000;

function checkPort(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(true); // Port is in use
            } else {
                resolve(false);
            }
        });
        server.once('listening', () => {
            server.close();
            resolve(false); // Port is free
        });
        server.listen(port);
    });
}

function killPort(port) {
    return new Promise((resolve, reject) => {
        const command = process.platform === 'win32'
            ? `FOR /F "tokens=5" %a in ('netstat -aon ^| find ":${port}" ^| find "LISTENING"') do taskkill /F /PID %a`
            : `lsof -i :${port} | grep LISTEN | awk '{print $2}' | xargs kill -9`;

        exec(command, (error, stdout, stderr) => {
            // Ignore errors (e.g., if no process found between check and kill)
            resolve();
        });
    });
}

async function startServer() {
    const isInUse = await checkPort(PORT);
    if (isInUse) {
        console.log(`⚠️  Port ${PORT} is in use. Killing process...`);
        await killPort(PORT);
        console.log(`✓  Port ${PORT} cleared.`);
        // Give OS a moment to release the port
        await new Promise(r => setTimeout(r, 1000));
    } else {
        console.log(`✓  Port ${PORT} is free.`);
    }

    console.log('🚀 Starting server...');
    require('../server.js');
}

startServer();
