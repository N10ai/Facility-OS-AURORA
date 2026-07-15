import fs from 'node:fs';

const appPath='src/app/App.jsx';
const cssPath='src/styles/app.css';
let app=fs.readFileSync(appPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');

function replaceRequired(from,to,label){
  if(!app.includes(from)) throw new Error(`Missing marker: ${label}`);
  app=app.replace(from,to);
}

if(!app.includes("./components/CustomerReportGallery")){
  replaceRequired(
    "import { CustomerInventory } from './components/CustomerInventory';",
    "import { CustomerInventory } from './components/CustomerInventory';\nimport { CustomerReportGallery } from './components/CustomerReportGallery';",
    'customer report import'
  );
}

const employeeStart=app.indexOf('function EmployeeWorkOrders({profile,data,reload})');
const employeeEnd=app.indexOf('function ScoreRing',employeeStart);
if(employeeStart<0||employeeEnd<0) throw new Error('EmployeeWorkOrders function not found');
let employee=app.slice(employeeStart,employeeEnd);

if(!employee.includes('const todayMine=')){
  employee=employee.replace(
    "  const mine=data.workOrders.filter(order=>order.assigned_to_profile_id===profile.id&&order.status!=='archived'&&order.scheduled_date>=today);",
    "  const mine=data.workOrders.filter(order=>order.assigned_to_profile_id===profile.id&&order.status!=='archived');\n  const todayMine=mine.filter(order=>order.scheduled_date===today&&order.status!=='verified');\n  const upcomingMine=mine.filter(order=>order.scheduled_date>today&&order.status!=='verified').sort((a,b)=>(`${a.scheduled_date} ${a.scheduled_time||''}`).localeCompare(`${b.scheduled_date} ${b.scheduled_time||''}`));\n  const historyMine=mine.filter(order=>order.status==='verified'||order.scheduled_date<today).sort((a,b)=>(b.scheduled_date||'').localeCompare(a.scheduled_date||''));"
  );
}

if(!employee.includes('employeeWorkspaceV39')){
  const finalReturn=employee.lastIndexOf('  return <div className="page">');
  const closing=employee.lastIndexOf('\n}');
  if(finalReturn<0||closing<finalReturn) throw new Error('Employee list return not found');
  const newReturn=`  function missionCard(order){const facility=data.facilities.find(f=>f.id===order.facility_id);const areas=data.workOrderAreas.filter(a=>a.work_order_id===order.id);const complete=areas.filter(a=>a.status==='completed').length;const progress=areas.length?Math.round(complete/areas.length*100):0;return <button className="employeeMissionCard" key={order.id} onClick={()=>setSelected(order)}><div className="employeeMissionCardTop"><div><span>{order.scheduled_time||'Any time'}</span><strong>{order.title}</strong></div><div className={\`status \${order.status}\`}>{order.status.replaceAll('_',' ')}</div></div><p>{facility?.name||'Facility'} · {order.estimated_minutes||90} min</p><div className="employeeProgressTrack"><div style={{width:\`${progress}%\`}}/></div><small>{complete}/{areas.length} areas complete</small></button>}\n  return <div className="page employeeWorkspaceV39"><div className="pageHeader"><div><p className="eyebrow">Employee workspace</p><h1>My work</h1><p>See today's missions, what is coming next, and your verified history.</p></div><div className="employeeTodayBadge"><strong>{todayMine.length}</strong><span>today</span></div></div><section className="employeeTodaySection"><div className="panelTitle"><div><p className="eyebrow">Today</p><h2>Active missions</h2></div><span>{today}</span></div><div className="employeeMissionGrid">{todayMine.map(missionCard)}{!todayMine.length&&<Empty title="No missions today" text="New assignments will appear here automatically."/>}</div></section><div className="employeeWorkspaceGrid"><section className="panel"><div className="panelTitle"><div><p className="eyebrow">Next</p><h2>Upcoming</h2></div><span>{upcomingMine.length}</span></div><div className="employeeCompactMissions">{upcomingMine.slice(0,8).map(missionCard)}{!upcomingMine.length&&<Empty title="Nothing upcoming" text="Your schedule is clear after today."/>}</div></section><section className="panel"><div className="panelTitle"><div><p className="eyebrow">Completed</p><h2>History</h2></div><span>{historyMine.length}</span></div><div className="employeeHistory">{historyMine.slice(0,10).map(order=>{const facility=data.facilities.find(f=>f.id===order.facility_id);return <button key={order.id} onClick={()=>setSelected(order)}><CheckCircle2 size={18}/><div><strong>{order.title}</strong><span>{facility?.name||'Facility'} · {order.scheduled_date}</span></div><div className={\`status \${order.status}\`}>{order.status}</div></button>})}{!historyMine.length&&<Empty title="No history yet" text="Verified missions will appear here."/>}</div></section></div></div>;`;
  employee=employee.slice(0,finalReturn)+newReturn+employee.slice(closing);
}
app=app.slice(0,employeeStart)+employee+app.slice(employeeEnd);

if(app.includes("if(page==='customer-proof') content=<InspectionReports profile={profile} data={data}/>;")){
  app=app.replace(
    "if(page==='customer-proof') content=<InspectionReports profile={profile} data={data}/>;",
    "if(page==='customer-proof') content=<CustomerReportGallery profile={profile} data={data}/>;"
  );
}else if(!app.includes("if(page==='customer-proof') content=<CustomerReportGallery profile={profile} data={data}/>;")){
  throw new Error('Customer report route not found');
}

const styles=`

/* Aurora v3.9 employee workspace and customer reports */
.employeeWorkspaceV39{display:grid;gap:18px}.employeeTodayBadge{min-width:86px;border-radius:20px;background:#0f172a;color:#fff;padding:12px 18px;text-align:center}.employeeTodayBadge strong,.employeeTodayBadge span{display:block}.employeeTodayBadge strong{font-size:27px}.employeeTodayBadge span{font-size:11px;text-transform:uppercase;letter-spacing:.08em;opacity:.7}.employeeTodaySection{border:1px solid #bfdbfe;background:linear-gradient(145deg,#eff6ff,#fff);border-radius:26px;padding:20px}.employeeMissionGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}.employeeMissionCard{border:1px solid var(--line);background:#fff;border-radius:20px;padding:16px;text-align:left;color:var(--ink);display:grid;gap:11px;box-shadow:0 8px 24px rgba(15,23,42,.05)}.employeeMissionCardTop{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.employeeMissionCardTop span,.employeeMissionCardTop strong{display:block}.employeeMissionCardTop>div:first-child span{font-size:12px;color:#2563eb;font-weight:800;margin-bottom:4px}.employeeMissionCardTop strong{font-size:17px}.employeeMissionCard p,.employeeMissionCard small{margin:0;color:var(--muted)}.employeeProgressTrack{height:7px;background:#e2e8f0;border-radius:999px;overflow:hidden}.employeeProgressTrack div{height:100%;background:#2563eb;border-radius:inherit}.employeeWorkspaceGrid{display:grid;grid-template-columns:1.1fr .9fr;gap:16px}.employeeCompactMissions{display:grid;gap:10px}.employeeCompactMissions .employeeMissionCard{box-shadow:none}.employeeHistory{display:grid;gap:8px}.employeeHistory>button{border:0;background:#f8fafc;border-radius:14px;padding:12px;display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;text-align:left;color:var(--ink)}.employeeHistory strong,.employeeHistory span{display:block}.employeeHistory span{font-size:12px;color:var(--muted);margin-top:3px}.customerReportsV39{display:grid;gap:18px}.customerReportStack{display:grid;gap:18px}.customerReportCard{background:#fff;border:1px solid var(--line);border-radius:26px;padding:22px;box-shadow:0 16px 38px rgba(15,23,42,.06)}.customerReportCard>header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.customerReportCard h2{margin:4px 0 8px}.customerReportCard p{margin:0;color:var(--muted)}.customerReportScore{min-width:88px;height:88px;border-radius:50%;display:grid;place-items:center;background:#eff6ff;color:#1d4ed8;border:8px solid #dbeafe}.customerReportScore strong{font-size:25px}.customerReportScore span{font-size:11px}.customerReportFacts{display:flex;gap:18px;flex-wrap:wrap;margin:20px 0;color:var(--muted)}.customerReportFacts span{display:flex;align-items:center;gap:7px}.customerAreaScores{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.customerAreaScore{display:flex;justify-content:space-between;gap:10px;border-radius:14px;background:#f8fafc;padding:12px}.customerAreaScore.passed{background:#ecfdf5}.customerAreaScore.failed{background:#fef2f2}.customerReportPhotos{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:16px}.customerReportPhotos button{position:relative;border:0;padding:0;overflow:hidden;border-radius:16px;aspect-ratio:1;background:#e2e8f0}.customerReportPhotos img{width:100%;height:100%;object-fit:cover}.customerReportPhotos span{position:absolute;left:8px;bottom:8px;background:rgba(15,23,42,.72);color:#fff;padding:4px 8px;border-radius:999px;font-size:10px;text-transform:capitalize}.customerReportEmpty{text-align:center;padding:42px}.customerReportEmpty h2{margin:10px 0 5px}.customerReportEmpty p{margin:0;color:var(--muted)}
@media(max-width:950px){.employeeMissionGrid{grid-template-columns:repeat(2,1fr)}.employeeWorkspaceGrid{grid-template-columns:1fr}.customerAreaScores,.customerReportPhotos{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.employeeMissionGrid{grid-template-columns:1fr}.employeeTodaySection{padding:15px}.employeeTodayBadge{display:none}.customerReportCard{padding:16px}.customerReportCard>header{flex-direction:column}.customerReportScore{width:72px;height:72px;min-width:72px}.customerAreaScores,.customerReportPhotos{grid-template-columns:repeat(2,1fr)}}
`;
if(!css.includes('Aurora v3.9 employee workspace and customer reports')) css+=styles;

fs.writeFileSync(appPath,app);
fs.writeFileSync(cssPath,css);
console.log('Applied Aurora v3.9 employee workspace and customer reports.');
