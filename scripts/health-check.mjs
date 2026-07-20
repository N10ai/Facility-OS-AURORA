import fs from 'node:fs';

const productionFinanceMigration = 'supabase/migrations/20260719225114_secure_finance_rls_foundation.sql';
const productionOperationsMigration = 'supabase/migrations/20260719231109_secure_operations_rls_foundation.sql';
const productionTenantMigration = 'supabase/migrations/20260720002459_secure_remaining_public_tables.sql';
const productionConfigurationMigration = 'supabase/migrations/20260720002519_secure_configuration_and_legacy_tables.sql';
const productionStorageMigration = 'supabase/migrations/20260720002528_secure_photo_storage_tenants.sql';
const productionRpcMigration = 'supabase/migrations/20260720002536_restrict_privileged_rpc_execution.sql';

const requiredFiles = [
  'package.json','package-lock.json','index.html','vite.config.js','src/app/App.jsx','src/main.jsx',
  productionFinanceMigration,productionOperationsMigration,productionTenantMigration,
  productionConfigurationMigration,productionStorageMigration,productionRpcMigration,
];
const requiredScripts = ['scripts/integrate-v3.18.mjs','scripts/integrate-v3.21.mjs','scripts/integrate-v3.23.mjs'];
const failures = [];

for (const file of [...requiredFiles, ...requiredScripts]) {
  if (!fs.existsSync(file)) failures.push(`Missing required file: ${file}`);
}

if (fs.existsSync('package.json')) {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  for (const script of ['dev','build','prebuild','health']) {
    if (!packageJson.scripts?.[script]) failures.push(`Missing npm script: ${script}`);
  }
  const prebuild = packageJson.scripts?.prebuild ?? '';
  for (const script of requiredScripts) {
    if (!prebuild.includes(script)) failures.push(`Prebuild does not include ${script}`);
  }
}

if (fs.existsSync('src/app/App.jsx')) {
  const appSource = fs.readFileSync('src/app/App.jsx', 'utf8');
  for (const marker of ['AdminRequestsWorkspace','CustomerFinance','EmployeeWorkspace']) {
    if (!appSource.includes(marker)) failures.push(`App integration marker missing: ${marker}`);
  }
}

function auditSecurityMigration(file, label, markers) {
  if (!fs.existsSync(file)) return;
  const migrationSource = fs.readFileSync(file, 'utf8');
  for (const marker of markers) {
    if (!migrationSource.includes(marker)) failures.push(`${label} security migration marker missing: ${marker}`);
  }
  for (const pattern of [
    /create\s+policy[\s\S]{0,180}using\s*\(\s*true\s*\)/i,
    /create\s+policy[\s\S]{0,180}with\s+check\s*\(\s*true\s*\)/i,
  ]) {
    if (pattern.test(migrationSource)) {
      failures.push(`${label} security migration contains an unrestricted RLS policy.`);
      break;
    }
  }
}

auditSecurityMigration(productionFinanceMigration,'Finance',['app_private.current_profile_company_id','customers view own invoices','customers view own payments','owners and admins view payroll']);
auditSecurityMigration(productionOperationsMigration,'Operations',['app_private.can_access_work_order','app_private.can_access_service_visit','operations view accessible work orders','operations view accessible service visits','customers create own requests','operations view inspections']);
auditSecurityMigration(productionTenantMigration,'Tenant data',['company members view company','customers view own facilities','users view own notifications','company admins manage portal invites']);
auditSecurityMigration(productionConfigurationMigration,'Configuration',['facility_buildings','facility_supply_inventory','owners admins view commissions']);
auditSecurityMigration(productionStorageMigration,'Storage',['tenant inspection photo uploads','tenant proof photo uploads','storage.foldername']);
auditSecurityMigration(productionRpcMigration,'RPC',['get_portal_invite_preview','claim_portal_invite','customer_respond_to_quote']);

if (failures.length) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  process.exit(1);
}
console.log('Facility OS repository health audit passed.');