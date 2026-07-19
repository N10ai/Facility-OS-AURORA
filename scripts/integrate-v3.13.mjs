import fs from 'node:fs';

const appPath='src/app/App.jsx';
let app=fs.readFileSync(appPath,'utf8');
if(!app.includes("import { CustomerSchedule } from './components/CustomerSchedule';")) {
  app=app.replace("import { CustomerReportGallery } from './components/CustomerReportGallery';", "import { CustomerReportGallery } from './components/CustomerReportGallery';\nimport { CustomerSchedule } from './components/CustomerSchedule';");
}
app=app.replace("if(page==='customer-proof') content=<CustomerReportGallery profile={profile} data={data}/>;", "if(page==='customer-schedule') content=<CustomerSchedule profile={profile} data={data}/>;\n    else if(page==='customer-proof') content=<CustomerReportGallery profile={profile} data={data}/>;");
fs.writeFileSync(appPath,app);

const pkgPath='package.json';
const pkg=JSON.parse(fs.readFileSync(pkgPath,'utf8'));
pkg.name='facilityos-v3-13-customer-schedule';
pkg.version='3.13.0';
fs.writeFileSync(pkgPath,JSON.stringify(pkg,null,2)+'\n');
