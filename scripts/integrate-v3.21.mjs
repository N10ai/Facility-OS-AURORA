import fs from 'node:fs';

const path = 'src/app/App.jsx';
let source = fs.readFileSync(path, 'utf8');

if (!source.includes("import { CustomerFinance } from './components/CustomerFinance';")) {
  source = source.replace(
    "import { CustomerSchedule } from './components/CustomerSchedule';",
    "import { CustomerSchedule } from './components/CustomerSchedule';\nimport { CustomerFinance } from './components/CustomerFinance';",
  );
}

source = source.replace(
  "const customerNav = [['customer-home','Overview',Home],['customer-schedule','Schedule',CalendarDays],['customer-proof','Service Reports',FileText],['customer-inventory','Inventory',PackageOpen],['customer-requests','Requests',Wrench]];",
  "const customerNav = [['customer-home','Overview',Home],['customer-schedule','Schedule',CalendarDays],['customer-proof','Service Reports',FileText],['customer-finance','Billing',Receipt],['customer-inventory','Inventory',PackageOpen],['customer-requests','Requests',Wrench]];",
);

if (!source.includes("page==='customer-finance'")) {
  source = source.replace(
    "if(page==='customer-schedule') content=<CustomerSchedule profile={profile} data={data}/>;",
    "if(page==='customer-schedule') content=<CustomerSchedule profile={profile} data={data}/>;\n    else if(page==='customer-finance') content=<CustomerFinance profile={profile} data={data}/>;",
  );
}

fs.writeFileSync(path, source);
console.log('Aurora v3.21 customer finance integration applied.');
