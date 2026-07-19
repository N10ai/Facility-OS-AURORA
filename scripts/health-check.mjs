import fs from 'node:fs';

const requiredFiles = [
  'package.json',
  'package-lock.json',
  'index.html',
  'vite.config.js',
  'src/app/App.jsx',
  'src/main.jsx',
];

const requiredScripts = [
  'scripts/integrate-v3.18.mjs',
  'scripts/integrate-v3.21.mjs',
  'scripts/integrate-v3.23.mjs',
];

const failures = [];

for (const file of [...requiredFiles, ...requiredScripts]) {
  if (!fs.existsSync(file)) failures.push(`Missing required file: ${file}`);
}

if (fs.existsSync('package.json')) {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  for (const script of ['dev', 'build', 'prebuild', 'health']) {
    if (!packageJson.scripts?.[script]) failures.push(`Missing npm script: ${script}`);
  }

  const prebuild = packageJson.scripts?.prebuild ?? '';
  for (const script of requiredScripts) {
    if (!prebuild.includes(script)) failures.push(`Prebuild does not include ${script}`);
  }
}

if (fs.existsSync('src/app/App.jsx')) {
  const appSource = fs.readFileSync('src/app/App.jsx', 'utf8');
  const expectedMarkers = [
    'AdminRequestsWorkspace',
    'CustomerFinance',
    'EmployeeWorkspace',
  ];
  for (const marker of expectedMarkers) {
    if (!appSource.includes(marker)) failures.push(`App integration marker missing: ${marker}`);
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  process.exit(1);
}

console.log('Facility OS repository health audit passed.');
