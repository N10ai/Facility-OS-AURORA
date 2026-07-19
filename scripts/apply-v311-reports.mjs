import fs from 'node:fs';

const appPath='src/app/App.jsx';
const packagePath='package.json';
let app=fs.readFileSync(appPath,'utf8');
const pkg=JSON.parse(fs.readFileSync(packagePath,'utf8'));

const importMarker="import { EmployeeWorkspace } from './components/EmployeeWorkspace';";
if(!app.includes("./components/ReportsWorkspace")){
  if(!app.includes(importMarker)) throw new Error('Reports import marker not found.');
  app=app.replace(importMarker,`${importMarker}\nimport { ReportsWorkspace } from './components/ReportsWorkspace';`);
}

const oldRoute='    else if(page===\'reports\') content=<ModulePlaceholder title="Reports" description="Operations, proof-of-service, customer, financial, and employee performance reports."/>;';
const newRoute="    else if(page==='reports') content=<ReportsWorkspace data={data}/>;";
if(app.includes(oldRoute)) app=app.replace(oldRoute,newRoute);
else if(!app.includes(newRoute)) throw new Error('Reports route marker not found.');

pkg.name='facilityos-v3-11-reports';
pkg.version='3.11.0';

fs.writeFileSync(appPath,app);
fs.writeFileSync(packagePath,`${JSON.stringify(pkg,null,2)}\n`);
console.log('Integrated Aurora v3.11 reports workspace.');
