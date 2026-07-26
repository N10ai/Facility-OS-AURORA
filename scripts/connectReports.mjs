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
if (!text.includes(communicationsImport)) text = text.replace(reportsImport, reportsImport + "\n" + communicationsImport);
const customer360Import = "import { Customer360 } from './components/Customer360';";
if (!text.includes(customer360Import)) text = text.replace(communicationsImport, communicationsImport + "\n" + customer360Import);
const accessImport = "import { TeamAccessManager } from './components/TeamAccessManager';";
if (!text.includes(accessImport)) text = text.replace(customer360Import, customer360Import + "\n" + accessImport);

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
text = text.replace(
  "else if(page==='employees') content=<EmployeesPage data={data} companyId={profile.company_id} reload={reload}/>;",
  "else if(page==='employees') content=<TeamAccessManager profile={profile} data={data} reload={reload}/>;"
);

if (!text.includes('<Customer360 customer={customer}')) {
  const selectedWorkspace = /  if\(selected\)\{[\s\S]*?\n  \}\n\n  return <div className="page">/;
  const customer360Workspace = `  if(selected){
    const customer=data.customers.find(c=>c.id===selected.id)||selected;
    return <>
      <Customer360 customer={customer} data={data} onBack={()=>setSelected(null)} onEdit={editCustomer} onNavigate={setPage} onArchive={archive}/>
      <Modal open={open} title={editing?'Edit customer':'New customer'} onClose={()=>setOpen(false)}><div className="form">
        <label>Name<input value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/></label>
        <div className="form2"><label>Type<select value={form.customer_type||'commercial'} onChange={e=>setForm({...form,customer_type:e.target.value})}><option>commercial</option><option>logistics</option><option>medical</option><option>retail</option></select></label><label>Monthly value<input type="number" value={form.monthly_value||''} onChange={e=>setForm({...form,monthly_value:e.target.value})}/></label></div>
        <div className="form2"><label>Email<input value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Phone<input value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})}/></label></div>
        <label>Address<input value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})}/></label>
        {message&&<div className="notice">{message}</div>}<Button onClick={save}>Save changes</Button>
      </div></Modal>
    </>;
  }

  return <div className="page">`;
  if (!selectedWorkspace.test(text)) throw new Error('Customer workspace integration marker not found.');
  text = text.replace(selectedWorkspace, customer360Workspace);
}

text = text.replace("function Shell({profile,portal,setPortal,page,setPage,data,children}) {","function Shell({profile,portal,setPortal,page,setPage,data,onLogout,children}) {");
if (!text.includes('const portalOptions=')) text = text.replace("const flatAdmin=adminGroups.flatMap(g=>g.items);","const flatAdmin=adminGroups.flatMap(g=>g.items);\n  const portalOptions=['owner','admin','manager','supervisor'].includes(profile.role)?['admin','employee','customer']:profile.role==='customer'?['customer']:['employee'];");
text = text.replace("<div className=\"portalSwitch\">{['admin','employee','customer'].map(p=><button key={p} className={portal===p?'active':''} onClick={()=>{setPortal(p);setPage(p==='admin'?'overview':p==='employee'?'employee-home':'customer-home')}}>{p}</button>)}</div>","<div className=\"portalSwitch\">{portalOptions.map(p=><button key={p} className={portal===p?'active':''} onClick={()=>{setPortal(p);setPage(p==='admin'?'overview':p==='employee'?'employee-home':'customer-home')}}>{p}</button>)}</div>");
text = text.replace("<div className=\"profileCard\"><div className=\"avatar\">{profile.full_name?.slice(0,1)||'U'}</div><div><strong>{profile.full_name}</strong><span>{profile.role}</span></div></div>","<div className=\"profileCard\"><div className=\"avatar\">{profile.full_name?.slice(0,1)||'U'}</div><div className=\"grow\"><strong>{profile.full_name}</strong><span>{profile.role}</span></div><button className=\"icon\" onClick={onLogout} aria-label=\"Log out\"><LogOut size={18}/></button></div>");
text = text.replace("<button className=\"avatarButton\">{profile.full_name?.slice(0,1)||'U'}</button>","<button className=\"avatarButton\" onClick={()=>setMobileSheet('Account')} aria-label=\"Open account menu\">{profile.full_name?.slice(0,1)||'U'}</button>");
text = text.replace("{mobileSheet && <div className=\"mobileSheetBackdrop\" onClick={()=>setMobileSheet(null)}><section className=\"mobileSheet\" onClick={e=>e.stopPropagation()}><div className=\"sheetHandle\"/><h3>{mobileSheet}</h3>{(mobileSheet==='More' ? adminGroups.filter(g=>['Team','Reports','Settings'].includes(g.label)).flatMap(g=>g.items) : adminGroups.find(g=>g.label===mobileSheet)?.items||[]).map(([key,label,Icon])=><button key={key} onClick={()=>selectPage(key)}><Icon size={19}/><span>{label}</span><ChevronRight size={17}/></button>)}</section></div>}","{mobileSheet && <div className=\"mobileSheetBackdrop\" onClick={()=>setMobileSheet(null)}><section className=\"mobileSheet\" onClick={e=>e.stopPropagation()}><div className=\"sheetHandle\"/><h3>{mobileSheet}</h3>{mobileSheet==='Account'?<><div className=\"personRow\"><div className=\"avatar\">{profile.full_name?.slice(0,1)||'U'}</div><div className=\"grow\"><strong>{profile.full_name}</strong><span>{profile.role}</span></div></div><button onClick={onLogout}><LogOut size={19}/><span>Log out</span><ChevronRight size={17}/></button></>:(mobileSheet==='More' ? adminGroups.filter(g=>['Team','Reports','Settings'].includes(g.label)).flatMap(g=>g.items) : adminGroups.find(g=>g.label===mobileSheet)?.items||[]).map(([key,label,Icon])=><button key={key} onClick={()=>selectPage(key)}><Icon size={19}/><span>{label}</span><ChevronRight size={17}/></button>)}</section></div>}");
text = text.replace("return <Shell profile={profile} portal={portal} setPortal={setPortal} page={page} setPage={setPage} data={data}>{content}</Shell>;","return <Shell profile={profile} portal={portal} setPortal={setPortal} page={page} setPage={setPage} data={data} onLogout={async()=>{await supabase.auth.signOut();setSession(null);setProfile(null);setData(empty)}}>{content}</Shell>;");

text = text.replace("<div className=\"form2\"><label>Employee<select value={form.assigned_to_profile_id} onChange={e=>setForm({...form,assigned_to_profile_id:e.target.value})}><option value=\"\">Unassigned</option>{employees.map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}</select></label><label>Estimated minutes<input type=\"number\" value={form.estimated_minutes} onChange={e=>setForm({...form,estimated_minutes:e.target.value})}/></label></div>","<div className=\"form2\"><label>Employee (optional)<select value={form.assigned_to_profile_id} onChange={e=>setForm({...form,assigned_to_profile_id:e.target.value})}><option value=\"\">Unassigned — assign later</option>{employees.map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}</select><small>Assign when this job is ready to appear in an employee's mobile portal.</small></label><label>Estimated minutes<input type=\"number\" value={form.estimated_minutes} onChange={e=>setForm({...form,estimated_minutes:e.target.value})}/></label></div>");
if (!text.includes('async function assignEmployee(order,profileId)')) text = text.replace("async function archive(order){","async function assignEmployee(order,profileId){const previous=order.assigned_to_profile_id||null;const {data,error}=await supabase.rpc('reassign_work_order',{p_work_order_id:order.id,p_assigned_profile_id:profileId||null,p_note:previous?'Reassigned from manager workspace':'Initial assignment from manager workspace'});if(error)return setMessage(error.message);setMessage(profileId?(previous?'Work order reassigned.':'Employee assigned.'):'Work order unassigned.');await reload();setSelected(data||{...order,assigned_to_profile_id:profileId||null});}\n\n  async function archive(order){");
const statsMarker = `<div className="stats">
        <Stat icon={CalendarDays} label="Scheduled" value={current.scheduled_date} note={current.scheduled_time||'No time'}/>
        <Stat icon={CircleUserRound} label="Assigned" value={employee(current.assigned_to_profile_id)?.full_name||'Unassigned'} note="Employee"/>
        <Stat icon={Clock} label="Actual time" value={actualMinutes?\`${actualMinutes} min\`:'—'} note={\`${current.estimated_minutes||0} min estimated\`}/>
        <Stat icon={CheckCircle2} label="Progress" value={\`${progress}%\`} note={\`${completed}/${areas.length} areas\`}/>
      </div>`;
if (!text.includes('Assign or reassign this mission')) text = text.replace(statsMarker, statsMarker + `
      <section className="panel"><div className="panelTitle"><div><h2>Employee assignment</h2><p>Assign, reassign, or return this mission to the unassigned queue. The previous employee loses access after refresh and the new employee sees it in the mobile portal.</p></div></div><label>Assigned employee<select value={current.assigned_to_profile_id||''} onChange={e=>assignEmployee(current,e.target.value)}><option value="">Unassigned — assign later</option>{employees.filter(p=>(p.status||'active')==='active').map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}</select></label></section>`);

fs.writeFileSync(file, text);
