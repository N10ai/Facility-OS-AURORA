import fs from 'node:fs';

const appPath = 'src/app/App.jsx';
let app = fs.readFileSync(appPath, 'utf8');

if (!app.includes("./components/EmployeeWorkspace")) {
  const marker = "import { CustomerReportGallery } from './components/CustomerReportGallery';";
  if (!app.includes(marker)) throw new Error('Employee workspace import marker not found.');
  app = app.replace(marker, `${marker}\nimport { EmployeeWorkspace } from './components/EmployeeWorkspace';`);
}

const oldRoute = "    content=<EmployeeWorkOrders profile={profile} data={data} reload={reload}/>;";
const newRoute = "    content=<EmployeeWorkspace profile={profile} data={data} reload={reload}/>;";
if (app.includes(oldRoute)) app = app.replace(oldRoute, newRoute);
else if (!app.includes(newRoute)) throw new Error('Employee portal route marker not found.');

fs.writeFileSync(appPath, app);
console.log('Wired isolated Aurora v3.9 employee workspace.');
