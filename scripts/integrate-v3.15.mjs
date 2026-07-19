import './integrate-v3.14.mjs';
import fs from 'node:fs';

const appPath='src/app/App.jsx';
const packagePath='package.json';
let app=fs.readFileSync(appPath,'utf8');
const pkg=JSON.parse(fs.readFileSync(packagePath,'utf8'));

if(!app.includes("./components/EmployeeScheduleWorkspace")){
  const marker="import { EmployeeWorkspace } from './components/EmployeeWorkspace';";
  if(!app.includes(marker)) throw new Error('Employee workspace import marker missing');
  app=app.replace(marker,`${marker}\nimport { EmployeeScheduleWorkspace } from './components/EmployeeScheduleWorkspace';`);
}

const oldBranch="  } else if(portal==='employee') {\n    content=<EmployeeWorkspace profile={profile} data={data} reload={reload}/>;\n  } else {";
const newBranch="  } else if(portal==='employee') {\n    if(page==='employee-schedule') content=<EmployeeScheduleWorkspace profile={profile} data={data} mode=\"schedule\"/>;\n    else if(page==='employee-history') content=<EmployeeScheduleWorkspace profile={profile} data={data} mode=\"history\"/>;\n    else content=<EmployeeWorkspace profile={profile} data={data} reload={reload}/>;\n  } else {";
if(app.includes(oldBranch)) app=app.replace(oldBranch,newBranch);
else if(!app.includes("page==='employee-schedule'")) throw new Error('Employee portal route marker missing');

pkg.name='facilityos-v3-15-employee-schedule-history';
pkg.version='3.15.0';
pkg.scripts.prebuild='node scripts/integrate-v3.15.mjs';
fs.writeFileSync(appPath,app);
fs.writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n');
console.log('Applied Aurora v3.15 employee schedule and history integration.');
