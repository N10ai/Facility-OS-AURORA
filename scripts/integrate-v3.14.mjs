import './integrate-v3.13.mjs';
import fs from 'node:fs';

const appPath='src/app/App.jsx';
const packagePath='package.json';
let app=fs.readFileSync(appPath,'utf8');
const pkg=JSON.parse(fs.readFileSync(packagePath,'utf8'));

if(!app.includes("./components/CustomerBilling")){
  const marker="import { CustomerSchedule } from './components/CustomerSchedule';";
  const fallback="import { CustomerReportGallery } from './components/CustomerReportGallery';";
  if(app.includes(marker)) app=app.replace(marker,`${marker}\nimport { CustomerBilling } from './components/CustomerBilling';`);
  else if(app.includes(fallback)) app=app.replace(fallback,`${fallback}\nimport { CustomerBilling } from './components/CustomerBilling';`);
  else throw new Error('Customer portal import marker missing');
}

if(!app.includes("['customer-billing','Billing'")){
  app=app.replace("['customer-inventory','Inventory',PackageOpen],['customer-requests','Requests',Wrench]","['customer-inventory','Inventory',PackageOpen],['customer-billing','Billing',Receipt],['customer-requests','Requests',Wrench]");
}

if(!app.includes("page==='customer-billing'")){
  app=app.replace("if(page==='customer-proof') content=<CustomerReportGallery profile={profile} data={data}/>;","if(page==='customer-billing') content=<CustomerBilling profile={profile} data={data}/>;\n    else if(page==='customer-proof') content=<CustomerReportGallery profile={profile} data={data}/>;");
}

pkg.name='facilityos-v3-14-customer-billing';
pkg.version='3.14.0';
pkg.scripts.prebuild='node scripts/integrate-v3.14.mjs';
fs.writeFileSync(appPath,app);
fs.writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n');
console.log('Applied Aurora v3.14 customer billing integration.');
