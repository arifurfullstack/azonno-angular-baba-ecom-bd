const { fork } = require('child_process');
const path = require('path');

console.log('🚀 Starting Unified Azonnox Application...');

let isShuttingDown = false;
let apiProcess = null;
let themeProcess = null;

function startApiProcess() {
  if (isShuttingDown) return;
  const apiPath = path.join(__dirname, 'apix', 'dist', 'main.js');
  console.log('📦 Launching API Backend from:', apiPath);
  
  apiProcess = fork(apiPath, [], {
    cwd: path.join(__dirname, 'apix'),
    stdio: 'inherit',
    env: { ...process.env, PORT: process.env.INTERNAL_API_PORT || '3000' }
  });

  apiProcess.on('error', (err) => {
    console.error('❌ Failed to start API process:', err);
  });

  apiProcess.on('exit', (code, signal) => {
    if (!isShuttingDown) {
      console.error(`⚠️ API process exited with code ${code} (signal: ${signal}). Auto-restarting in 2 seconds...`);
      setTimeout(startApiProcess, 2000);
    }
  });
}

function startThemeProcess() {
  if (isShuttingDown) return;
  const themePath = path.join(__dirname, 'themex', 'dist', 'angular-ui', 'server', 'server.mjs');
  console.log('🌐 Launching Gateway & Storefront Server from:', themePath);
  
  themeProcess = fork(themePath, [], {
    cwd: path.join(__dirname, 'themex'),
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: process.env.PORT || '4220',
      INTERNAL_API_PORT: process.env.INTERNAL_API_PORT || '3000'
    }
  });

  themeProcess.on('error', (err) => {
    console.error('❌ Failed to start Gateway server:', err);
  });

  themeProcess.on('exit', (code, signal) => {
    if (!isShuttingDown) {
      console.error(`⚠️ Gateway process exited with code ${code} (signal: ${signal}). Auto-restarting in 2 seconds...`);
      setTimeout(startThemeProcess, 2000);
    }
  });
}

startApiProcess();
startThemeProcess();

const cleanup = () => {
  console.log('\n🛑 Shutting down unified application...');
  isShuttingDown = true;
  if (apiProcess) apiProcess.kill();
  if (themeProcess) themeProcess.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
