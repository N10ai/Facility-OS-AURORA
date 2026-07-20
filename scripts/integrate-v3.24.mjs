import fs from 'node:fs';

const path = 'src/app/App.jsx';
let source = fs.readFileSync(path, 'utf8');

if (!source.includes("import { CommunicationHub } from './components/CommunicationHub';")) {
  const anchor = "import { ContractorsWorkspace } from './components/ContractorsWorkspace';";
  if (!source.includes(anchor)) throw new Error('Communication integration failed: import anchor not found.');
  source = source.replace(anchor, `${anchor}\nimport { CommunicationHub } from './components/CommunicationHub';`);
}

source = source.replace(
  /\{ label:'CRM', icon:UsersRound, items:\[.*?\] \},/,
  "{ label:'CRM', icon:UsersRound, items:[['customers','Customers',UsersRound],['contacts','Contacts',CircleUserRound],['communications','Communications',Mail],['quotes','Quotes',FileText],['facilities','Facilities',Building2]] },"
);

if (!source.includes("page==='communications'")) {
  const routeAnchor = "else if(page==='work-orders') content=<WorkOrdersPage";
  const routeIndex = source.indexOf(routeAnchor);
  if (routeIndex === -1) throw new Error('Communication integration failed: route anchor not found.');
  source = `${source.slice(0, routeIndex)}else if(page==='communications') content=<CommunicationHub data={data}/>;\n    ${source.slice(routeIndex)}`;
}

if (!source.includes("['communications','Communications',Mail]")) {
  throw new Error('Communication integration failed: CRM navigation item missing after patch.');
}
if (!source.includes("page==='communications'")) {
  throw new Error('Communication integration failed: page route missing after patch.');
}

fs.writeFileSync(path, source);
console.log('Aurora v3.24 Communications integrated into production source.');
