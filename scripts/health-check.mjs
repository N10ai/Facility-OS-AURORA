import net from 'node:net';
import fs from 'node:fs';

const required = ['package.json', 'index.html', 'vite.config.js', 'src/app/App.jsx'];
let failed = false;

for (const file of required) {
  if (!fs.existsSync(file)) {
    console.error(`Missing required file: ${file}`);
    failed = true;
  }
}

await new Promise((resolve) => {
  const socket = net.createConnection({ host: '127.0.0.1', port: 3000 });
  socket.on('connect', () => {
    console.log('FacilityOS server: READY on port 3000');
    socket.end();
    resolve();
  });
  socket.on('error', () => {
    console.error('FacilityOS server: NOT RUNNING on port 3000');
    failed = true;
    resolve();
  });
  setTimeout(() => {
    socket.destroy();
    resolve();
  }, 1000);
});

process.exit(failed ? 1 : 0);
