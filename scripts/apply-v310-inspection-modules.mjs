import fs from 'node:fs';

const appPath = 'src/app/App.jsx';
const mainPath = 'src/app/main.jsx';
const packagePath = 'package.json';
const scopePath = 'docs/V3_10_SCOPE.md';
const testPath = 'docs/V3_10_TEST_PLAN.md';

let app = fs.readFileSync(appPath, 'utf8');
let main = fs.readFileSync(mainPath, 'utf8');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

function replaceRequired(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`Missing marker: ${label}`);
  return source.replace(from, to);
}

if (!app.includes('ClipboardList, Images, ScanSearch, ThumbsUp')) {
  app = replaceRequired(
    app,
    '  Mail, Phone, MapPinned, History, ContactRound, BriefcaseBusiness, UserPlus, Building, Activity\n} from \'lucide-react\';',
    '  Mail, Phone, MapPinned, History, ContactRound, BriefcaseBusiness, UserPlus, Building, Activity,\n  ClipboardList, Images, ScanSearch, ThumbsUp\n} from \'lucide-react\';',
    'inspection icon imports',
  );
}

if (!app.includes('completeInspection, createInspection, updateInspectionArea')) {
  app = replaceRequired(
    app,
    '  createQuote, createInvoice, createPayment, createExpense, createPayrollEntry\n} from \'../services/api\';',
    '  createQuote, createInvoice, createPayment, createExpense, createPayrollEntry,\n  completeInspection, createInspection, updateInspectionArea, updateInspectionItem, uploadInspectionPhoto\n} from \'../services/api\';',
    'inspection API imports',
  );
}

main = main.replace(
  /import \{\n  AlertTriangle,\n  ClipboardList,\n  Images,\n  ScanSearch,\n  ThumbsUp,\n\} from 'lucide-react';/,
  "import { AlertTriangle } from 'lucide-react';",
);
main = main.replace(
  /import \{\n  completeInspection,\n  createInspection,\n  updateInspectionArea,\n  updateInspectionItem,\n  uploadInspectionPhoto,\n\} from '\.\.\/services\/api';\n/,
  '',
);
main = main.replace(
  /\/\/ v3\.7 generated the inspection workspace[\s\S]*?Object\.assign\(globalThis, \{[\s\S]*?\}\);\n\n/,
  '',
);

if (main.includes('Object.assign(globalThis')) {
  throw new Error('Inspection global runtime bridge was not removed.');
}

pkg.name = 'facilityos-v3-10-inspection-modules';
pkg.version = '3.10.0';

fs.writeFileSync(appPath, app);
fs.writeFileSync(mainPath, main);
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
fs.writeFileSync(scopePath, `# Aurora v3.10.0 — Inspection Module Stabilization\n\n- Removes the temporary global runtime bridge from the application entry point.\n- Imports inspection icons and API functions directly in App.jsx.\n- Preserves the application-level error boundary.\n- Keeps the existing database schema and inspection workflows unchanged.\n- Establishes a safer module baseline for the next operational feature increment.\n`);
fs.writeFileSync(testPath, `# Aurora v3.10.0 Test Plan\n\n1. Production build passes.\n2. The app opens without global inspection bindings.\n3. Admin Inspections renders without a blank screen.\n4. A draft inspection can be created.\n5. Inspection areas and checklist items can be updated.\n6. Inspection photos can be uploaded.\n7. An inspection can be completed.\n8. The error boundary still renders for unexpected module failures.\n`);

console.log('Applied Aurora v3.10 inspection module stabilization.');
