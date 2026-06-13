const { spawn } = require('child_process');
const path = require('path');

console.log('\n====================================================');
console.log('🚀 Starting Find Chord Development Suite...');
console.log('====================================================\n');

// 1. Iniciar Bridge do MuseScore
const bridgeProcess = spawn('node', [path.join(__dirname, 'musescore-bridge.cjs')], {
  stdio: 'inherit'
});

// 2. Iniciar Vite Dev Server
const viteProcess = spawn('npx', ['vite'], {
  stdio: 'inherit'
});

let isExiting = false;
const cleanExit = () => {
  if (isExiting) return;
  isExiting = true;
  console.log('\nStopping development servers...');
  try {
    bridgeProcess.kill('SIGINT');
  } catch (e) {}
  try {
    viteProcess.kill('SIGINT');
  } catch (e) {}
  process.exit(0);
};

// Se qualquer um dos processos filhos encerrar, encerra o runner também
bridgeProcess.on('exit', () => cleanExit());
viteProcess.on('exit', () => cleanExit());

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);
