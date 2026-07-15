import fs from 'node:fs';

const appPath='src/app/App.jsx';
const cssPath='src/styles/app.css';
let app=fs.readFileSync(appPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');

function replaceOnce(from,to,label){
  if(!app.includes(from)) throw new Error(`Missing App marker: ${label}`);
  app=app.replace(from,to);
}

if(!app.includes('const allMine=data.workOrders.filter')){
  replaceOnce(
    "  const mine=data.workOrders.filter(order=>order.assigned_to_profile_id===profile.id&&order.status!=='archived'&&order.scheduled_date>=today);",
    "  const allMine=data.workOrders.filter(order=>order.assigned_to_profile_id===profile.id&&order.status!=='archived').sort((a,b)=>`${a.scheduled_date||''} ${a.scheduled_time||''}`.localeCompare(`${b.scheduled_date||''} ${b.scheduled_time||''}`));\n  const todayMine=allMine.filter(order=>order.scheduled_date===today&&!['verified'].includes(order.status));\n  const upcomingMine=allMine.filter(order=>order.scheduled_date>today&&!['verified'].includes(order.status));\n  const historyMine=allMine.filter(order=>order.status==='verified'||order.scheduled_date<today).sort((a,b)=>(b.scheduled_date||'').localeCompare(a.scheduled_date||''));",
    'employee collections'
  );
}

const oldReturn=`  return <div className="page"><div className="pageHeader"><div><p className="eyebrow">Employee Portal</p><h1>Today's missions</h1><p>Complete each assigned work order area by area.</p></div></div><div className="missionCards">{mine.map(order=>{const facility=data.facilities.find(f=>f.id===order.facility_id);return <button className="missionCard" key={order.id} onClick={()=>setSelected(order)}><div className="missionTime">{order.scheduled_date} · {order.scheduled_time||'Any time'}</div><h2>{order.title}</h2><p>{facility?.name}</p><div className={\`status \${order.status}\`}>{order.status}</div></button>})}{!mine.length&&<Empty title="No assigned work orders" text="Assigned missions will appear here."/>}</div></div>;`;

const newReturn=`  function missionCard(order){const facility=data.facilities.find(f=>f.id===order.facility_id);const areas=data.workOrderAreas.filter(a=>a.work_order_id===order.id);const complete=areas.filter(a=>a.status==='completed').length;const progress=areas.length?Math.round(complete/areas.length*100):0;return <button className="employeeMissionCard" key={order.id} onClick={()=>setSelected(order)}><div className="employeeMissionTop"><div><span>{order.scheduled_time||'Any time'}</span><strong>{order.title}</strong></div><div className={\`status \${order.status}\`}>{order.status.replaceAll('_',' ')}</div></div><p>{facility?.name||'Facility'} · {order.estimated_minutes||90} min</p><div className="missionProgress"><div style={{width:\`${progress}%\`}}/><span>{complete}/{areas.length} areas</span></div></button>}
  return <div className="page employeeWorkspace"><div className="pageHeader"><div><p className="eyebrow">Employee workspace</p><h1>My work</h1><p>See what needs to be completed now, what is coming next, and your verified history.</p></div><div className="employeeTodayBadge"><strong>{todayMine.length}</strong><span>today</span></div></div><section className="employeeSection employeeToday"><div className="panelTitle"><div><p className="eyebrow">Today</p><h2>Active missions</h2></div><span>{today}</span></div><div className="employeeMissionGrid">{todayMine.map(missionCard)}{!todayMine.length&&<Empty title="No missions today" text="New assignments will appear here automatically."/>}</div></section><div className="employeeColumns"><section className="panel"><div className="panelTitle"><div><p className="eyebrow">Next</p><h2>Upcoming</h2></div><span>{upcomingMine.length}</span></div><div className="employeeCompactList">{upcomingMine.slice(0,8).map(missionCard)}{!upcomingMine.length&&<Empty title="Nothing upcoming" text="Your schedule is clear after today."/>}</div></section><section className="panel"><div className="panelTitle"><div><p className="eyebrow">Completed</p><h2>History</h2></div><span>{historyMine.length}</span></div><div className="employeeHistoryList">{historyMine.slice(0,8).map(order=>{const facility=data.facilities.find(f=>f.id===order.facility_id);return <button key={order.id} onClick={()=>setSelected(order)}><CheckCircle2 size={18}/><div><strong>{order.title}</strong><span>{facility?.name||'Facility'} · {order.scheduled_date}</span></div><div className={\`status \${order.status}\`}>{order.status}</div></button>})}{!historyMine.length&&<Empty title="No completed history" text="Verified missions will appear here."/>}</div></section></div></div>;`;

if(!app.includes('className="page employeeWorkspace"')) replaceOnce(oldReturn,newReturn,'employee workspace return');

const styles=`

/* Aurora v3.8 employee workspace */
.employeeWorkspace{display:grid;gap:18px}.employeeTodayBadge{min-width:86px;border-radius:20px;background:#0f172a;color:#fff;padding:12px 18px;text-align:center}.employeeTodayBadge strong,.employeeTodayBadge span{display:block}.employeeTodayBadge strong{font-size:25px}.employeeTodayBadge span{font-size:11px;opacity:.72;text-transform:uppercase;letter-spacing:.08em}
.employeeSection{border-radius:26px;padding:21px;background:linear-gradient(145deg,#eff6ff,#fff);border:1px solid #bfdbfe}.employeeMissionGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}.employeeMissionCard{display:grid;gap:12px;text-align:left;border:1px solid var(--line);background:#fff;border-radius:20px;padding:16px;color:var(--ink);box-shadow:0 8px 24px rgba(15,23,42,.05)}.employeeMissionCard:hover{border-color:#93c5fd;transform:translateY(-1px)}
.employeeMissionTop{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.employeeMissionTop>div:first-child span,.employeeMissionTop>div:first-child strong{display:block}.employeeMissionTop>div:first-child span{font-size:12px;color:#2563eb;font-weight:800;margin-bottom:5px}.employeeMissionTop>div:first-child strong{font-size:17px}.employeeMissionCard p{margin:0;color:var(--muted)}.missionProgress{position:relative;height:7px;background:#e2e8f0;border-radius:999px;margin-top:4px}.missionProgress>div{height:100%;border-radius:inherit;background:#2563eb}.missionProgress span{display:block;font-size:10px;color:var(--muted);margin-top:6px}
.employeeColumns{display:grid;grid-template-columns:1.15fr .85fr;gap:16px}.employeeCompactList{display:grid;gap:10px}.employeeCompactList .employeeMissionCard{box-shadow:none}.employeeHistoryList{display:grid;gap:7px}.employeeHistoryList>button{border:0;background:#f8fafc;border-radius:14px;padding:12px;display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;text-align:left;color:var(--ink)}.employeeHistoryList strong,.employeeHistoryList span{display:block}.employeeHistoryList span{color:var(--muted);font-size:12px;margin-top:3px}
@media(max-width:950px){.employeeMissionGrid{grid-template-columns:repeat(2,1fr)}.employeeColumns{grid-template-columns:1fr}}@media(max-width:650px){.employeeMissionGrid{grid-template-columns:1fr}.employeeSection{padding:15px}.employeeTodayBadge{display:none}}
`;
if(!css.includes('Aurora v3.8 employee workspace')) css+=styles;

fs.writeFileSync(appPath,app);
fs.writeFileSync(cssPath,css);
console.log('Applied Aurora v3.8 employee workspace.');