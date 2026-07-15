import fs from 'node:fs';

const appPath='src/app/App.jsx';
const cssPath='src/styles/app.css';
let app=fs.readFileSync(appPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');

function replaceRequired(pattern,replacement,label){
  if(!pattern.test(app)) throw new Error(`Missing marker: ${label}`);
  app=app.replace(pattern,replacement);
}

if(!app.includes('const historyMine=allMine.filter')){
  replaceRequired(
    /  const mine=data\.workOrders\.filter\(order=>order\.assigned_to_profile_id===profile\.id&&order\.status!==['"]archived['"]&&order\.scheduled_date>=today\);/,
    "  const allMine=data.workOrders.filter(order=>order.assigned_to_profile_id===profile.id&&order.status!=='archived');\n  const todayMine=allMine.filter(order=>order.scheduled_date===today&&!['verified'].includes(order.status));\n  const upcomingMine=allMine.filter(order=>order.scheduled_date>today&&!['verified'].includes(order.status)).sort((a,b)=>`${a.scheduled_date||''} ${a.scheduled_time||''}`.localeCompare(`${b.scheduled_date||''} ${b.scheduled_time||''}`));\n  const historyMine=allMine.filter(order=>order.status==='verified'||order.scheduled_date<today).sort((a,b)=>(b.scheduled_date||'').localeCompare(a.scheduled_date||''));",
    'employee collections'
  );

  const newReturn=`  function missionCard(order){const facility=data.facilities.find(f=>f.id===order.facility_id);const areas=data.workOrderAreas.filter(a=>a.work_order_id===order.id);const done=areas.filter(a=>a.status==='completed').length;const progress=areas.length?Math.round(done/areas.length*100):0;return <button className="employeeMissionCard" key={order.id} onClick={()=>setSelected(order)}><div className="employeeMissionTop"><div><span>{order.scheduled_time||'Any time'}</span><strong>{order.title}</strong></div><div className={\`status \${order.status}\`}>{order.status.replaceAll('_',' ')}</div></div><p>{facility?.name||'Facility'} · {order.estimated_minutes||90} min</p><div className="employeeMissionProgress"><div style={{width:\`${progress}%\`}}/><span>{done}/{areas.length} areas</span></div></button>}\n  return <div className="page employeeWorkspace"><div className="pageHeader"><div><p className="eyebrow">Employee workspace</p><h1>My work</h1><p>Complete today's missions, review what is next, and see verified history.</p></div><div className="employeeTodayCount"><strong>{todayMine.length}</strong><span>today</span></div></div><section className="employeeTodayPanel"><div className="panelTitle"><div><p className="eyebrow">Today</p><h2>Active missions</h2></div><span>{today}</span></div><div className="employeeMissionGrid">{todayMine.map(missionCard)}{!todayMine.length&&<Empty title="No missions today" text="New assignments will appear here automatically."/>}</div></section><div className="employeeWorkspaceColumns"><section className="panel"><div className="panelTitle"><div><p className="eyebrow">Next</p><h2>Upcoming</h2></div><span>{upcomingMine.length}</span></div><div className="employeeCompactList">{upcomingMine.slice(0,8).map(missionCard)}{!upcomingMine.length&&<Empty title="Nothing upcoming" text="Your schedule is clear after today."/>}</div></section><section className="panel"><div className="panelTitle"><div><p className="eyebrow">Completed</p><h2>History</h2></div><span>{historyMine.length}</span></div><div className="employeeHistoryList">{historyMine.slice(0,10).map(order=>{const facility=data.facilities.find(f=>f.id===order.facility_id);return <button key={order.id} onClick={()=>setSelected(order)}><CheckCircle2 size={18}/><div><strong>{order.title}</strong><span>{facility?.name||'Facility'} · {order.scheduled_date}</span></div><div className={\`status \${order.status}\`}>{order.status}</div></button>})}{!historyMine.length&&<Empty title="No completed history" text="Verified missions will appear here."/>}</div></section></div></div>;`;
  replaceRequired(
    /  return <div className="page"><div className="pageHeader"><div><p className="eyebrow">Employee Portal<\/p><h1>Today's missions<\/h1>[\s\S]*?<\/div><\/div>;\n}\n\n\nfunction ScoreRing/,
    `${newReturn}\n}\n\n\nfunction ScoreRing`,
    'employee workspace return'
  );
}

if(!app.includes('const [managerPhotoIndex,setManagerPhotoIndex]')){
  replaceRequired(
    /  const \[verification,setVerification\]=useState\(\{summary:'Service completed according to the facility plan\.',quality_score:100,return_note:''\}\);/,
    "  const [verification,setVerification]=useState({summary:'Service completed according to the facility plan.',quality_score:100,return_note:''});\n  const [managerPhotoIndex,setManagerPhotoIndex]=useState(null);",
    'manager photo state'
  );
  replaceRequired(
    /    const usage=data\.supplyUsage\.filter\(item=>item\.work_order_id===current\.id\);/,
    "    const usage=data.supplyUsage.filter(item=>item.work_order_id===current.id);\n    const relatedInspections=data.inspections.filter(i=>i.work_order_id===current.id);\n    const managerPhotos=data.inspectionPhotos.filter(p=>relatedInspections.some(i=>i.id===p.inspection_id));",
    'manager photo collection'
  );
  replaceRequired(
    /      \{current\.status==='awaiting_verification'&&<section className="panel verificationPanel">/,
    "      {managerPhotos.length>0&&<section className=\"panel managerPhotoReview\"><div className=\"panelTitle\"><div><p className=\"eyebrow\">Evidence review</p><h2>Inspection photos</h2></div><span>{managerPhotos.length}</span></div><div className=\"missionPhotoGrid\">{managerPhotos.map((photo,index)=><button key={photo.id||index} onClick={()=>setManagerPhotoIndex(index)}><img src={photo.file_url||photo.public_url||photo.url} alt={photo.photo_type||'Inspection evidence'}/><span>{photo.photo_type||'photo'}</span></button>)}</div></section>}\n      {managerPhotoIndex!==null&&<PhotoLightbox photos={managerPhotos} initialIndex={managerPhotoIndex} onClose={()=>setManagerPhotoIndex(null)}/>}\n      {current.status==='awaiting_verification'&&<section className=\"panel verificationPanel\">",
    'manager photo review'
  );
}

const styles=`

/* Aurora v3.9 employee and manager experience */
.employeeWorkspace{display:grid;gap:18px}.employeeTodayCount{min-width:86px;border-radius:20px;background:#0f172a;color:#fff;padding:12px 18px;text-align:center}.employeeTodayCount strong,.employeeTodayCount span{display:block}.employeeTodayCount strong{font-size:26px}.employeeTodayCount span{font-size:11px;opacity:.72;text-transform:uppercase;letter-spacing:.08em}.employeeTodayPanel{border-radius:26px;padding:21px;background:linear-gradient(145deg,#eff6ff,#fff);border:1px solid #bfdbfe}.employeeMissionGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}.employeeMissionCard{display:grid;gap:12px;text-align:left;border:1px solid var(--line);background:#fff;border-radius:20px;padding:16px;color:var(--ink);box-shadow:0 8px 24px rgba(15,23,42,.05)}.employeeMissionCard:hover{border-color:#93c5fd;transform:translateY(-1px)}.employeeMissionTop{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.employeeMissionTop>div:first-child span,.employeeMissionTop>div:first-child strong{display:block}.employeeMissionTop>div:first-child span{font-size:12px;color:#2563eb;font-weight:800;margin-bottom:5px}.employeeMissionTop>div:first-child strong{font-size:17px}.employeeMissionCard p{margin:0;color:var(--muted)}.employeeMissionProgress{position:relative;height:7px;background:#e2e8f0;border-radius:999px;margin-top:4px}.employeeMissionProgress>div{height:100%;border-radius:inherit;background:#2563eb}.employeeMissionProgress span{display:block;font-size:10px;color:var(--muted);margin-top:6px}.employeeWorkspaceColumns{display:grid;grid-template-columns:1.15fr .85fr;gap:16px}.employeeCompactList{display:grid;gap:10px}.employeeCompactList .employeeMissionCard{box-shadow:none}.employeeHistoryList{display:grid;gap:7px}.employeeHistoryList>button{border:0;background:#f8fafc;border-radius:14px;padding:12px;display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;text-align:left;color:var(--ink)}.employeeHistoryList strong,.employeeHistoryList span{display:block}.employeeHistoryList span{color:var(--muted);font-size:12px;margin-top:3px}.managerPhotoReview{margin-top:16px}
@media(max-width:950px){.employeeMissionGrid{grid-template-columns:repeat(2,1fr)}.employeeWorkspaceColumns{grid-template-columns:1fr}}@media(max-width:650px){.employeeMissionGrid{grid-template-columns:1fr}.employeeTodayPanel{padding:15px}.employeeTodayCount{display:none}}
`;
if(!css.includes('Aurora v3.9 employee and manager experience')) css+=styles;

fs.writeFileSync(appPath,app);
fs.writeFileSync(cssPath,css);
console.log('Applied Aurora v3.9 employee and manager experience.');
