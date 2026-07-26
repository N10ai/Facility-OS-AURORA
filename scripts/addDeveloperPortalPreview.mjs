import fs from 'node:fs';

const file = 'src/app/App.jsx';
let text = fs.readFileSync(file, 'utf8');

text = text.replace(
  "function Shell({profile,portal,setPortal,page,setPage,data,children}) {",
  "function Shell({profile,portal,setPortal,page,setPage,data,previewProfile,setPreviewProfile,children}) {"
);

if (!text.includes("const canPreviewPortal=")) {
  text = text.replace(
    "const flatAdmin=adminGroups.flatMap(g=>g.items);",
    "const flatAdmin=adminGroups.flatMap(g=>g.items);\n  const canPreviewPortal=['owner','admin'].includes(profile.role);\n  const previewEmployees=data.people.filter(p=>['employee','manager','supervisor','contractor'].includes(p.role)&&p.status!=='inactive');"
  );
}

text = text.replace(
  "<button className=\"avatarButton\" onClick={()=>setMobileSheet('Account')} aria-label=\"Open account menu\">{profile.full_name?.slice(0,1)||'U'}</button>",
  "<button className=\"avatarButton\" onClick={()=>setMobileSheet('Account')} aria-label=\"Open account menu\">{profile.full_name?.slice(0,1)||'U'}</button>"
);

const sheetOld = `{mobileSheet && <div className="mobileSheetBackdrop" onClick={()=>setMobileSheet(null)}><section className="mobileSheet" onClick={e=>e.stopPropagation()}><div className="sheetHandle"/><h3>{mobileSheet}</h3>{mobileSheet==='Account'?<><div className="personRow"><div className="avatar">{profile.full_name?.slice(0,1)||'U'}</div><div className="grow"><strong>{profile.full_name}</strong><span>{profile.role}</span></div></div><button onClick={onLogout}><LogOut size={19}/><span>Log out</span><ChevronRight size={17}/></button></>:(mobileSheet==='More' ? adminGroups.filter(g=>['Team','Reports','Settings'].includes(g.label)).flatMap(g=>g.items) : adminGroups.find(g=>g.label===mobileSheet)?.items||[]).map(([key,label,Icon])=><button key={key} onClick={()=>selectPage(key)}><Icon size={19}/><span>{label}</span><ChevronRight size={17}/></button>)}</section></div>}`;

const sheetNew = `{mobileSheet && <div className="mobileSheetBackdrop" onClick={()=>setMobileSheet(null)}><section className="mobileSheet" onClick={e=>e.stopPropagation()}><div className="sheetHandle"/><h3>{mobileSheet}</h3>{mobileSheet==='Account'?<><div className="personRow"><div className="avatar">{profile.full_name?.slice(0,1)||'U'}</div><div className="grow"><strong>{profile.full_name}</strong><span>{previewProfile?\`Previewing \${previewProfile.full_name}\`:profile.role}</span></div></div>{canPreviewPortal&&<div className="form"><label>Employee preview<select value={previewProfile?.id||''} onChange={e=>setPreviewProfile(previewEmployees.find(p=>p.id===e.target.value)||null)}><option value="">Use my account</option>{previewEmployees.map(p=><option key={p.id} value={p.id}>{p.full_name||p.email||'Employee'}</option>)}</select></label><Button onClick={()=>{setPortal('employee');setPage('employee-home');setMobileSheet(null)}}>Open employee view</Button>{previewProfile&&<Button variant="secondary" onClick={()=>{setPreviewProfile(null);setPortal('admin');setPage('overview');setMobileSheet(null)}}>Exit preview</Button>}</div>}<button onClick={onLogout}><LogOut size={19}/><span>Log out</span><ChevronRight size={17}/></button></>:(mobileSheet==='More' ? adminGroups.filter(g=>['Team','Reports','Settings'].includes(g.label)).flatMap(g=>g.items) : adminGroups.find(g=>g.label===mobileSheet)?.items||[]).map(([key,label,Icon])=><button key={key} onClick={()=>selectPage(key)}><Icon size={19}/><span>{label}</span><ChevronRight size={17}/></button>)}</section></div>}`;

if (text.includes(sheetOld)) text = text.replace(sheetOld, sheetNew);

if (!text.includes('previewProfile&&portal===\'employee\'')) {
  text = text.replace(
    "<section className=\"canvas\">{children}</section>",
    "<section className=\"canvas\">{previewProfile&&portal==='employee'&&<div className=\"notice\">Owner preview: {previewProfile.full_name||previewProfile.email}. Actions in this view affect the selected employee's assignments.</div>}{children}</section>"
  );
}

if (!text.includes("const [previewProfile,setPreviewProfile]")) {
  text = text.replace(
    "const [portal,setPortal]=useState('admin');",
    "const [portal,setPortal]=useState('admin');\n  const [previewProfile,setPreviewProfile]=useState(null);"
  );
}

text = text.replace(
  "content=<EmployeeWorkOrders profile={profile} data={data} reload={reload}/>;",
  "content=<EmployeeWorkOrders profile={previewProfile||profile} data={data} reload={reload}/>;"
);

text = text.replace(
  "return <Shell profile={profile} portal={portal} setPortal={setPortal} page={page} setPage={setPage} data={data} onLogout={async()=>{await supabase.auth.signOut();setSession(null);setProfile(null);setData(empty)}}>{content}</Shell>;",
  "return <Shell profile={profile} portal={portal} setPortal={setPortal} page={page} setPage={setPage} data={data} previewProfile={previewProfile} setPreviewProfile={setPreviewProfile} onLogout={async()=>{await supabase.auth.signOut();setSession(null);setProfile(null);setPreviewProfile(null);setData(empty)}}>{content}</Shell>;"
);

fs.writeFileSync(file, text);
