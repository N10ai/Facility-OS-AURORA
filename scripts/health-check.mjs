import fs from 'node:fs';

const productionFinanceMigration =
  'supabase/migrations/20260719225114_secure_finance_rls_foundation.sql';
const productionOperationsMigration =
  'supabase/migrations/20260719231109_secure_operations_rls_foundation.sql';

const requiredFiles = [
  'package.json',
  'package-lock.json',
  'index.html',
  'vite.config.js',
  'src/app/App.jsx',
  'src/main.jsx',
  productionFinanceMigration,
  productionOperationsMigration,
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

function auditSecurityMigration(file, label, markers) {
  if (!fs.existsSync(file)) return;

  const migrationSource = fs.readFileSync(file, 'utf8');
  for (const marker of markers) {
    if (!migrationSource.includes(marker)) {
      failures.push(`${label} security migration marker missing: ${marker}`);
    }
  }

  const forbiddenPatterns = [
    /create\s+policy[\s\S]{0,180}using\s*\(\s*true\s*\)/i,
    /create\s+policy[\s\S]{0,180}with\s+check\s*\(\s*true\s*\)/i,
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(migrationSource)) {
      failures.push(`${label} security migration contains an unrestricted RLS policy.`);
      break;
    }
  }
}

auditSecurityMigration(productionFinanceMigration, 'Finance', [
  'app_private.current_profile_company_id',
  'customers view own invoices',
  'customers view own payments',
  'owners and admins view payroll',
]);

auditSecurityMigration(productionOperationsMigration, 'Operations', [
  'app_private.can_access_work_order',
  'app_private.can_access_service_visit',
  'operations view accessible work orders',
  'operations view accessible service visits',
  'customers create own requests',
  'operations view inspections',
]);

if (failures.length) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  process.exit(1);
}

console.log('Facility OS repository health audit passed.');