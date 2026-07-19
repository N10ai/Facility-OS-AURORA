import fs from 'node:fs';

const path = 'src/app/App.jsx';
let source = fs.readFileSync(path, 'utf8');

if (!source.includes("import { AdminRequestsWorkspace } from './components/AdminRequestsWorkspace';")) {
  source = source.replace(
    "import { EmployeeWorkspace } from './components/EmployeeWorkspace';",
    "import { EmployeeWorkspace } from './components/EmployeeWorkspace';\nimport { AdminRequestsWorkspace } from './components/AdminRequestsWorkspace';",
  );
}

source = source.replace(
  "['calendar','Calendar',CalendarDays],['work-orders','Work Orders',ClipboardCheck],['issues','Issues',AlertTriangle]",
  "['calendar','Calendar',CalendarDays],['work-orders','Work Orders',ClipboardCheck],['customer-requests','Requests',Wrench],['issues','Issues',AlertTriangle]",
);

if (!source.includes("page==='customer-requests') content=<AdminRequestsWorkspace")) {
  source = source.replace(
    "else if(page==='work-orders') content=<WorkOrdersPage data={data} companyId={profile.company_id} profile={profile} reload={reload}/>;",
    "else if(page==='work-orders') content=<WorkOrdersPage data={data} companyId={profile.company_id} profile={profile} reload={reload}/>;\n    else if(page==='customer-requests') content=<AdminRequestsWorkspace data={data} companyId={profile.company_id} profile={profile} reload={reload} onOpenWorkOrders={()=>setPage('work-orders')}/>;",
  );
}

source = source.replace(
  "<div><strong>{r.title}</strong><span>{r.description}</span></div><div className={`status ${r.status}`}>{r.status}</div>",
  "<div><strong>{r.title}</strong><span>{r.description}</span>{r.admin_note&&<small>{r.admin_note}</small>}{r.scheduled_date&&<small>Scheduled for {r.scheduled_date}</small>}</div><div className={`status ${r.status}`}>{r.status}</div>",
);

fs.writeFileSync(path, source);
console.log('Aurora v3.23 customer request operations integration applied.');
