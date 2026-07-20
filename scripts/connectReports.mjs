import fs from 'node:fs';

const file = 'src/app/App.jsx';
let text = fs.readFileSync(file, 'utf8');

const reportsImport = "import { ReportsWorkspace } from './components/ReportsWorkspace';";
if (!text.includes(reportsImport)) {
  text = text.replace(
    "import { EmployeeWorkspace } from './components/EmployeeWorkspace';",
    "import { EmployeeWorkspace } from './components/EmployeeWorkspace';\n" + reportsImport
  );
}

const communicationsImport = "import { CommunicationsCenter } from './components/CommunicationsCenter';";
if (!text.includes(communicationsImport)) {
  text = text.replace(reportsImport, reportsImport + "\n" + communicationsImport);
}

text = text.replace(
  "else if(page==='reports') content=<ModulePlaceholder title=\"Reports\" description=\"Operations, proof-of-service, customer, financial, and employee performance reports.\"/>;",
  "else if(page==='reports') content=<ReportsWorkspace data={data}/>;"
);

text = text.replace(
  "{ label:'CRM', icon:UsersRound, items:[['customers','Customers',UsersRound],['contacts','Contacts',CircleUserRound],['quotes','Quotes',FileText],['facilities','Facilities',Building2]] },",
  "{ label:'CRM', icon:UsersRound, items:[['customers','Customers',UsersRound],['contacts','Contacts',CircleUserRound],['communications','Communications',Mail],['quotes','Quotes',FileText],['facilities','Facilities',Building2]] },"
);

if (!text.includes("else if(page==='communications') content=<CommunicationsCenter data={data}/>;")) {
  text = text.replace(
    "else if(page==='contacts') content=<ContactsPage data={data} companyId={profile.company_id} reload={reload}/>;",
    "else if(page==='contacts') content=<ContactsPage data={data} companyId={profile.company_id} reload={reload}/>;\n    else if(page==='communications') content=<CommunicationsCenter data={data}/>;"
  );
}

fs.writeFileSync(file, text);
