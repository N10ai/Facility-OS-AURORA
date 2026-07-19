import fs from 'node:fs';

const appPath='src/app/App.jsx';
const apiPath='src/services/api.js';
const packagePath='package.json';
let app=fs.readFileSync(appPath,'utf8');
let api=fs.readFileSync(apiPath,'utf8');
const pkg=JSON.parse(fs.readFileSync(packagePath,'utf8'));

if(!app.includes("./components/ContractorsWorkspace")){
  const marker="import { ReportsWorkspace } from './components/ReportsWorkspace';";
  if(!app.includes(marker)) throw new Error('Reports import marker missing');
  app=app.replace(marker,`${marker}\nimport { ContractorsWorkspace } from './components/ContractorsWorkspace';`);
}
app=app.replace('inspectionItems:[], inspectionPhotos:[]','inspectionItems:[], inspectionPhotos:[], contractors:[]');
app=app.replace('else if(page===\'contractors\') content=<ModulePlaceholder title="Contractors" description="Manage outsourced cleaners, plumbers, electricians, and other service partners."/>;',"else if(page==='contractors') content=<ContractorsWorkspace data={data} companyId={profile.company_id} reload={reload}/>;");

if(!api.includes('contractors:[]')) api=api.replace('inspectionItems:[], inspectionPhotos:[]','inspectionItems:[], inspectionPhotos:[], contractors:[]');
if(!api.includes('inspectionPhotos, contractors')){
  api=api.replace('quotes, invoices, payments, expenses, payroll, inspections, inspectionAreas, inspectionItems, inspectionPhotos\n  ] = await Promise.all([','quotes, invoices, payments, expenses, payroll, inspections, inspectionAreas, inspectionItems, inspectionPhotos, contractors\n  ] = await Promise.all([');
  api=api.replace("supabase.from('inspection_photos').select('*').eq('company_id',companyId).order('created_at',{ascending:false})\n  ]);","supabase.from('inspection_photos').select('*').eq('company_id',companyId).order('created_at',{ascending:false}),\n    supabase.from('contractors').select('*').eq('company_id',companyId).neq('status','archived').order('business_name')\n  ]);");
  api=api.replace('inspectionItems:inspectionItems.data||[], inspectionPhotos:inspectionPhotos.data||[]','inspectionItems:inspectionItems.data||[], inspectionPhotos:inspectionPhotos.data||[], contractors:contractors.data||[]');
}

pkg.name='facilityos-v3-12-contractors';
pkg.version='3.12.0';
fs.writeFileSync(appPath,app);
fs.writeFileSync(apiPath,api);
fs.writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n');
console.log('Applied Aurora v3.12 contractors integration.');