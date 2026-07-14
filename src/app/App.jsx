import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, Bell, Building2, CalendarDays, Camera, CheckCircle2,
  ChevronRight, CircleUserRound, ClipboardCheck, Clock, FileText, Home, Image, PackageOpen,
  LogOut, Menu, Plus, Search, Settings, ShieldCheck, Sparkles, UsersRound, Wrench, X
} from 'lucide-react';
import { configured, supabase } from '../services/supabase';
import {
  createCompany, createCustomer, createCustomerRequest, createFacility, createIssue,
  createPortalInvite, revokePortalInvite, getPortalInvitePreview, claimPortalInvite, createServicePlan, createWorkOrder, updateWorkOrder, archiveWorkOrder, updateWorkOrderArea, startWorkOrder, finishWorkOrder, recordSupplyUsage, generateVisits, getMyProfile, loadWorkspace,
  saveMyProfile, seedMIP, toggleTask, updateVisit, uploadProof, createSupplyItem, upsertFacilityInventory, adjustFacilityInventory, deleteRecord, updateRecord, archiveRecord,
  createCustomerContact, updateCustomerContact, archiveCustomerContact, checkInfrastructure
} from '../services/api';

const empty = {
  customers:[], contacts:[], facilities:[], people:[], plans:[], visits:[],
  tasks:[], proof:[], issues:[], requests:[], supplies:[], inventory:[], invites:[], workOrders:[], workOrderAreas:[], supplyUsage:[], timeEntries:[]
};

function Modal({open,title,onClose,children}) {
  if(!open) return null;
  return <div className="modalBackdrop">
    <section className="modal">
      <button className="icon close" onClick={onClose}><X size={18}/></button>
      <h2>{title}</h2>
      {children}
    </section>
  </div>;
}

function Button({children,variant='primary',...props}) {
  return <button className={`btn ${variant}`} {...props}>{children}</button>;
}

function Stat({label,value,note,icon:Icon,tone=''}) {
  return <div className={`stat ${tone}`}>
    {Icon && <div className="statIcon"><Icon size={19}/></div>}
    <strong>{value}</strong><span>{label}</span><small>{note}</small>
  </div>;
}

function Login({onReady,inviteToken}) {
  const [mode,setMode]=useState(inviteToken?'signup':'login');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [fullName,setFullName]=useState('');
  const [invite,setInvite]=useState(null);
  const [message,setMessage]=useState('');

  useEffect(()=>{
    if(!inviteToken) return;
    getPortalInvitePreview(inviteToken).then(({data,error})=>{
      if(error) return setMessage(error.message);
      const preview=Array.isArray(data)?data[0]:data;
      if(!preview) return setMessage('This invitation is invalid or expired.');
      setInvite(preview);
      setEmail(preview.email||'');
      setFullName(preview.full_name||'');
    });
  },[inviteToken]);

  async function submit() {
    const result = mode==='login'
      ? await supabase.auth.signInWithPassword({email,password})
      : await supabase.auth.signUp({
          email,
          password,
          options:{ data:{ full_name:fullName } }
        });

    if(result.error) return setMessage(result.error.message);

    const session=result.data?.session;
    if(inviteToken && session) {
      const claim=await claimPortalInvite(inviteToken);
      if(claim.error) return setMessage(claim.error.message);
      setMessage('Invitation accepted. Opening your portal...');
    } else if(inviteToken && !session) {
      setMessage('Account created. Confirm your email, then return to this invitation link and log in.');
    } else {
      setMessage(mode==='login'?'Logged in.':'Account created. Confirm email if required.');
    }
    onReady?.();
  }

  if(!configured) return <div className="loginPage"><div className="loginCard"><div className="logoMark">F</div><h1>FacilityOS</h1><p>Add your Supabase URL and anon key to <code>.env</code>.</p></div></div>;

  return <div className="loginPage">
    <div className="loginCard">
      <div className="logoMark">F</div>
      <p className="eyebrow">{inviteToken?'Portal invitation':'Aurora Operations'}</p>
      <h1>{inviteToken?'Join your FacilityOS workspace.':'Run your cleaning company from one workspace.'}</h1>
      <p>{inviteToken
        ? `You were invited as ${invite?.role||'a portal user'}. Create a password or log in to accept the invitation.`
        : 'Admin planning, employee execution, and customer visibility.'}</p>

      <div className="segmented">
        <button className={mode==='login'?'active':''} onClick={()=>setMode('login')}>Login</button>
        <button className={mode==='signup'?'active':''} onClick={()=>setMode('signup')}>Create account</button>
      </div>

      {mode==='signup'&&<label>Full name<input value={fullName} onChange={e=>setFullName(e.target.value)}/></label>}
      <label>Email<input value={email} readOnly={!!inviteToken} onChange={e=>setEmail(e.target.value)}/></label>
      <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
      <Button onClick={submit}>{mode==='login'?'Login':'Create account'}</Button>
      {message && <div className="notice">{message}</div>}
    </div>
  </div>;
}

function Setup({session,onDone}) {
  const [name,setName]=useState('N10 Enterprise LLC');
  const [fullName,setFullName]=useState('Ignacio');
  const [message,setMessage]=useState('');

  async function create() {
    const {data,error}=await createCompany(session.user,name);
    if(error) return setMessage(error.message);
    await saveMyProfile(session.user,{full_name:fullName,role:'owner',company_id:data.id});
    onDone();
  }

  return <div className="loginPage">
    <div className="loginCard">
      <div className="logoMark">F</div>
      <p className="eyebrow">One-time setup</p>
      <h1>Create your operating workspace.</h1>
      <label>Your name<input value={fullName} onChange={e=>setFullName(e.target.value)}/></label>
      <label>Company<input value={name} onChange={e=>setName(e.target.value)}/></label>
      <Button onClick={create}>Create workspace</Button>
      {message && <div className="notice">{message}</div>}
    </div>
  </div>;
}

const adminGroups = [
  { label:'Home', icon:Home, items:[['overview','Home',Home]] },
  { label:'CRM', icon:UsersRound, items:[['customers','Customers',UsersRound],['contacts','Contacts',CircleUserRound],['quotes','Quotes',FileText],['facilities','Facilities',Building2]] },
  { label:'Operations', icon:ClipboardCheck, items:[['calendar','Calendar',CalendarDays],['work-orders','Work Orders',ClipboardCheck],['issues','Issues',AlertTriangle],['inspections','Inspections',ShieldCheck],['supplies','Supplies',PackageOpen]] },
  { label:'Finance', icon:FileText, items:[['invoices','Invoices',FileText],['payments','Payments',CheckCircle2],['payroll','Payroll',CircleUserRound],['expenses','Expenses',FileText],['billing','Billing & Subscriptions',Settings]] },
  { label:'Team', icon:CircleUserRound, items:[['employees','Employees',CircleUserRound],['contractors','Contractors',Wrench]] },
  { label:'Reports', icon:FileText, items:[['reports','Reports',FileText]] },
  { label:'Settings', icon:Settings, items:[['settings','Settings',Settings]] }
];
const employeeNav = [['employee-home','Today',Home],['employee-schedule','Schedule',CalendarDays],['employee-history','History',CheckCircle2]];
const customerNav = [['customer-home','Overview',Home],['customer-schedule','Schedule',CalendarDays],['customer-proof','Service Proof',Image],['customer-requests','Requests',Wrench]];

function Shell({profile,portal,setPortal,page,setPage,children}) {
  const [mobileSheet,setMobileSheet]=useState(null);
  const flatAdmin=adminGroups.flatMap(g=>g.items);
  const nav = portal==='admin'?flatAdmin:portal==='employee'?employeeNav:customerNav;
  const bottom = portal==='admin'
    ? [['overview','Home',Home],['crm','CRM',UsersRound],['ops','Operations',ClipboardCheck],['finance','Finance',FileText],['more','More',Menu]]
    : nav.slice(0,4);

  function selectPage(key){setPage(key);setMobileSheet(null)}
  function bottomClick(key){
    if(key==='crm') return setMobileSheet('CRM');
    if(key==='ops') return setMobileSheet('Operations');
    if(key==='finance') return setMobileSheet('Finance');
    if(key==='more') return setMobileSheet('More');
    selectPage(key);
  }

  return <div className="appShell">
    <aside className="side expandedSide">
      <div className="brand"><div className="logoMark small">F</div><div><strong>FacilityOS</strong><span>Aurora Operations</span></div></div>
      <div className="portalSwitch">{['admin','employee','customer'].map(p=><button key={p} className={portal===p?'active':''} onClick={()=>{setPortal(p);setPage(p==='admin'?'overview':p==='employee'?'employee-home':'customer-home')}}>{p}</button>)}</div>
      {portal==='admin' ? <nav className="groupedNav">{adminGroups.map(group=><div className="navGroup" key={group.label}><div className="navGroupLabel">{group.label}</div>{group.items.map(([key,label,Icon])=><button key={key} className={page===key?'navItem active':'navItem'} onClick={()=>selectPage(key)}><Icon size={17}/><span>{label}</span></button>)}</div>)}</nav> : <nav>{nav.map(([key,label,Icon])=><button key={key} className={page===key?'navItem active':'navItem'} onClick={()=>selectPage(key)}><Icon size={18}/><span>{label}</span></button>)}</nav>}
      <div className="profileCard"><div className="avatar">{profile.full_name?.slice(0,1)||'U'}</div><div><strong>{profile.full_name}</strong><span>{profile.role}</span></div></div>
    </aside>
    <main className="main">
      <header className="top"><div><span>FacilityOS</span><strong>{nav.find(x=>x[0]===page)?.[1]||'Workspace'}</strong></div><button className="search"><Search size={18}/><span>Search anything...</span></button><button className="icon"><Bell size={18}/></button><button className="avatarButton">{profile.full_name?.slice(0,1)||'U'}</button></header>
      <section className="canvas">{children}</section>
    </main>
    <nav className="mobileBottom">{bottom.map(([key,label,Icon])=><button key={key} className={page===key?'active':''} onClick={()=>bottomClick(key)}><Icon size={20}/><span>{label}</span></button>)}</nav>
    {mobileSheet && <div className="mobileSheetBackdrop" onClick={()=>setMobileSheet(null)}><section className="mobileSheet" onClick={e=>e.stopPropagation()}><div className="sheetHandle"/><h3>{mobileSheet}</h3>{(mobileSheet==='More' ? adminGroups.filter(g=>['Team','Reports','Settings'].includes(g.label)).flatMap(g=>g.items) : adminGroups.find(g=>g.label===mobileSheet)?.items||[]).map(([key,label,Icon])=><button key={key} onClick={()=>selectPage(key)}><Icon size={19}/><span>{label}</span><ChevronRight size={17}/></button>)}</section></div>}
  </div>;
}

function AdminOverview({data,setPage}) {
  const today=new Date().toISOString().slice(0,10);
  const todayVisits=data.visits.filter(v=>v.scheduled_date===today);
  const openIssues=data.issues.filter(i=>i.status!=='closed');
  const activeEmployees=data.people.filter(p=>p.role==='employee');
  const activeCustomers=data.customers.length;

  return <div className="page">
    <div className="pageHeader"><div><p className="eyebrow">Operations control</p><h1>Good morning, Ignacio.</h1><p>Here’s what needs attention across your cleaning operation.</p></div><Button onClick={()=>setPage('calendar')}><Plus size={16}/> Plan service</Button></div>
    <div className="stats">
      <Stat icon={CalendarDays} label="Visits today" value={todayVisits.length} note={`${data.visits.length} scheduled total`}/>
      <Stat icon={UsersRound} label="Customers" value={activeCustomers} note="Active accounts" tone="pastelBlue"/>
      <Stat icon={CircleUserRound} label="Employees" value={activeEmployees.length} note="Available team" tone="pastelGreen"/>
      <Stat icon={AlertTriangle} label="Open issues" value={openIssues.length} note="Needs review" tone="pastelYellow"/>
    </div>
    <div className="grid2">
      <section className="panel large">
        <div className="panelTitle"><div><p className="eyebrow">Today</p><h2>Mission schedule</h2></div><button className="link" onClick={()=>setPage('calendar')}>View calendar</button></div>
        <div className="rows">
          {todayVisits.map(v=><VisitRow key={v.id} visit={v} data={data}/>)}
          {!todayVisits.length && <Empty title="No visits today" text="Create a service plan and generate visits."/>}
        </div>
      </section>
      <section className="darkCard">
        <Sparkles size={24}/>
        <h2>Operations focus</h2>
        <p>Use recurring plans to schedule the year, assign employees, and require photo proof before a mission can be verified.</p>
        <Button variant="light" onClick={()=>setPage('calendar')}>Open planning</Button>
      </section>
    </div>
    <div className="grid2">
      <section className="panel">
        <div className="panelTitle"><h2>Recent issues</h2></div>
        {openIssues.slice(0,5).map(i=><div className="simpleRow" key={i.id}><div className={`priority ${i.priority}`}/><div><strong>{i.title}</strong><span>{i.priority} · {i.status}</span></div></div>)}
        {!openIssues.length && <p>No open issues.</p>}
      </section>
      <section className="panel">
        <div className="panelTitle"><h2>Customer requests</h2></div>
        {data.requests.slice(0,5).map(r=><div className="simpleRow" key={r.id}><Wrench size={18}/><div><strong>{r.title}</strong><span>{r.status}</span></div></div>)}
        {!data.requests.length && <p>No customer requests.</p>}
      </section>
    </div>
  </div>;
}

function VisitRow({visit,data,onOpen}) {
  const customer=data.customers.find(x=>x.id===visit.customer_id);
  const facility=data.facilities.find(x=>x.id===visit.facility_id);
  const employee=data.people.find(x=>x.id===visit.assigned_to_profile_id);
  return <button className="visitRow" onClick={()=>onOpen?.(visit)}>
    <div className="dateTile"><strong>{visit.scheduled_time||'—'}</strong><span>{visit.scheduled_date}</span></div>
    <div><strong>{visit.title||'Service visit'}</strong><span>{customer?.name||'Customer'} · {facility?.name||'Facility'}</span></div>
    <div className="employeeChip">{employee?.full_name||'Unassigned'}</div>
    <div className={`status ${visit.status}`}>{visit.status}</div>
    <ChevronRight size={18}/>
  </button>;
}

function Empty({title,text}) {
  return <div className="empty"><div className="emptyIcon"><Sparkles size={22}/></div><strong>{title}</strong><p>{text}</p></div>;
}

function CustomersPage({data,companyId,reload}) {
  const blank={name:'',customer_type:'commercial',email:'',phone:'',address:'',monthly_value:''};
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState(blank);
  const [message,setMessage]=useState('');

  function newCustomer(){setEditing(null);setForm(blank);setMessage('');setOpen(true)}
  function editCustomer(customer){setEditing(customer);setForm({...blank,...customer});setMessage('');setOpen(true)}
  async function save() {
    const result=editing
      ? await updateRecord('customers',editing.id,{...form,monthly_value:Number(form.monthly_value||0)})
      : await createCustomer(companyId,form);
    if(result.error) return setMessage(result.error.message);
    setOpen(false);setEditing(null);setForm(blank);await reload();
  }
  async function archive(customer){
    if(!confirm(`Archive ${customer.name}?`)) return;
    const {error}=await archiveRecord('customers',customer.id);if(error)return setMessage(error.message);await reload();
  }
  async function remove(customer){
    if(!confirm(`Permanently delete ${customer.name}? This cannot be undone.`)) return;
    const {error}=await deleteRecord('customers',customer.id);if(error)return setMessage(error.message);await reload();
  }

  return <div className="page">
    <div className="pageHeader"><div><p className="eyebrow">CRM</p><h1>Customers</h1><p>Manage your cleaning accounts and their facilities.</p></div><Button onClick={newCustomer}><Plus size={16}/> New customer</Button></div>
    {message&&<div className="notice">{message}</div>}
    <div className="cards">
      {data.customers.map(c=>{const facilities=data.facilities.filter(f=>f.customer_id===c.id);const visits=data.visits.filter(v=>v.customer_id===c.id);return <article className="objectCard" key={c.id}><div className="objectHead"><div className="objectIcon">{c.name.slice(0,1)}</div><div className="status active">active</div></div><h2>{c.name}</h2><p>{c.customer_type||'commercial'}</p><div className="miniStats"><span><b>{facilities.length}</b> facilities</span><span><b>{visits.length}</b> visits</span><span><b>${c.monthly_value||0}</b>/mo</span></div><div className="cardActions"><button onClick={()=>editCustomer(c)}>Edit</button><button onClick={()=>archive(c)}>Archive</button><button className="dangerLink" onClick={()=>remove(c)}>Delete</button></div></article>})}
      {!data.customers.length && <Empty title="No customers" text="Create your first customer."/>}
    </div>
    <Modal open={open} title={editing?'Edit customer':'New customer'} onClose={()=>setOpen(false)}><div className="form">
      <label>Name<input value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/></label>
      <div className="form2"><label>Type<select value={form.customer_type||'commercial'} onChange={e=>setForm({...form,customer_type:e.target.value})}><option>commercial</option><option>logistics</option><option>medical</option><option>retail</option></select></label><label>Monthly value<input type="number" value={form.monthly_value||''} onChange={e=>setForm({...form,monthly_value:e.target.value})}/></label></div>
      <div className="form2"><label>Email<input value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Phone<input value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})}/></label></div>
      <label>Address<input value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})}/></label>
      {message&&<div className="notice">{message}</div>}<Button onClick={save}>{editing?'Save changes':'Create customer'}</Button>
    </div></Modal>
  </div>;
}


function ContactsPage({data,companyId,reload}) {
  const emptyContact={customer_id:'',full_name:'',title:'',email:'',phone:'',receives_reports:false,receives_invoices:false,receives_quotes:false};
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState(emptyContact);
  const [message,setMessage]=useState('');

  function startCreate(){setEditing(null);setForm(emptyContact);setMessage('');setOpen(true)}
  function startEdit(contact){setEditing(contact);setForm({...contact});setMessage('');setOpen(true)}

  async function save(){
    if(!form.customer_id) return setMessage('Select a customer.');
    if(!form.full_name) return setMessage('Contact name is required.');
    const result=editing
      ? await updateCustomerContact(editing.id,form)
      : await createCustomerContact(companyId,form);
    if(result.error) return setMessage(result.error.message);
    setOpen(false); await reload();
  }

  async function archiveContact(contact){
    if(!confirm(`Archive ${contact.full_name}?`)) return;
    const {error}=await archiveCustomerContact(contact.id);
    if(error) return setMessage(error.message);
    await reload();
  }

  return <div className="page">
    <div className="pageHeader">
      <div><p className="eyebrow">CRM</p><h1>Contacts</h1><p>Manage who receives reports, quotes, and invoices for each customer.</p></div>
      <Button onClick={startCreate}><Plus size={16}/> New contact</Button>
    </div>
    {message&&<div className="notice">{message}</div>}
    <section className="panel">
      {data.contacts.map(contact=>{
        const customer=data.customers.find(c=>c.id===contact.customer_id);
        return <div className="personRow" key={contact.id}>
          <div className="avatar">{contact.full_name?.slice(0,1)||'C'}</div>
          <div className="grow">
            <strong>{contact.full_name}</strong>
            <span>{customer?.name||'Customer'} · {contact.title||'Contact'} · {contact.email||contact.phone||'No contact method'}</span>
            <div className="contactFlags">
              {contact.receives_reports&&<em>Reports</em>}
              {contact.receives_quotes&&<em>Quotes</em>}
              {contact.receives_invoices&&<em>Invoices</em>}
            </div>
          </div>
          <div className="rowActions">
            <button onClick={()=>startEdit(contact)}>Edit</button>
            <button className="dangerText" onClick={()=>archiveContact(contact)}>Archive</button>
          </div>
        </div>
      })}
      {!data.contacts.length&&<Empty title="No contacts" text="Add the people who receive updates for each customer."/>}
    </section>
    <Modal open={open} title={editing?'Edit contact':'New contact'} onClose={()=>setOpen(false)}>
      <div className="form">
        <label>Customer<select value={form.customer_id||''} onChange={e=>setForm({...form,customer_id:e.target.value})}><option value="">Select...</option>{data.customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <div className="form2"><label>Full name<input value={form.full_name||''} onChange={e=>setForm({...form,full_name:e.target.value})}/></label><label>Title<input value={form.title||''} onChange={e=>setForm({...form,title:e.target.value})}/></label></div>
        <div className="form2"><label>Email<input value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Phone<input value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})}/></label></div>
        <div className="checkGrid">
          <label><input type="checkbox" checked={!!form.receives_reports} onChange={e=>setForm({...form,receives_reports:e.target.checked})}/> Service reports</label>
          <label><input type="checkbox" checked={!!form.receives_quotes} onChange={e=>setForm({...form,receives_quotes:e.target.checked})}/> Quotes</label>
          <label><input type="checkbox" checked={!!form.receives_invoices} onChange={e=>setForm({...form,receives_invoices:e.target.checked})}/> Invoices</label>
        </div>
        {message&&<div className="notice">{message}</div>}
        <Button onClick={save}>{editing?'Save changes':'Create contact'}</Button>
      </div>
    </Modal>
  </div>;
}

function FacilitiesPage({data,companyId,reload}) {
  const blank={customer_id:'',name:'',facility_type:'office',address:'',access_notes:'',restroom_count:0,floor_type:'',estimated_minutes:90};
  const [open,setOpen]=useState(false);const [editing,setEditing]=useState(null);const [form,setForm]=useState(blank);const [message,setMessage]=useState('');
  function newFacility(){setEditing(null);setForm(blank);setMessage('');setOpen(true)}
  function editFacility(f){setEditing(f);setForm({...blank,...f});setMessage('');setOpen(true)}
  async function save(){const payload={...form,restroom_count:Number(form.restroom_count||0),estimated_minutes:Number(form.estimated_minutes||0)};const result=editing?await updateRecord('facilities',editing.id,payload):await createFacility(companyId,payload);if(result.error)return setMessage(result.error.message);setOpen(false);setEditing(null);await reload()}
  async function archive(f){if(!confirm(`Archive ${f.name}?`))return;const{error}=await archiveRecord('facilities',f.id);if(error)return setMessage(error.message);await reload()}
  async function remove(f){if(!confirm(`Permanently delete ${f.name}?`))return;const{error}=await deleteRecord('facilities',f.id);if(error)return setMessage(error.message);await reload()}
  return <div className="page"><div className="pageHeader"><div><p className="eyebrow">Digital twins</p><h1>Facilities</h1><p>Each site stores access, cleaning conditions, schedule, proof, and issues.</p></div><Button onClick={newFacility}><Plus size={16}/> New facility</Button></div>{message&&<div className="notice">{message}</div>}<div className="cards">{data.facilities.map(f=>{const customer=data.customers.find(c=>c.id===f.customer_id);return <article className="objectCard" key={f.id}><div className="objectHead"><div className="objectIcon"><Building2 size={21}/></div><div className="status active">{f.status}</div></div><h2>{f.name}</h2><p>{customer?.name} · {f.facility_type}</p><div className="miniStats"><span><b>{f.restroom_count||0}</b> restrooms</span><span><b>{f.estimated_minutes||0}</b> min</span></div><div className="softBox"><strong>Floor</strong><span>{f.floor_type||'Not set'}</span></div><div className="cardActions"><button onClick={()=>editFacility(f)}>Edit</button><button onClick={()=>archive(f)}>Archive</button><button className="dangerLink" onClick={()=>remove(f)}>Delete</button></div></article>})}</div><Modal open={open} title={editing?'Edit facility':'New facility'} onClose={()=>setOpen(false)}><div className="form"><label>Customer<select value={form.customer_id||''} onChange={e=>setForm({...form,customer_id:e.target.value})}><option value="">Select...</option>{data.customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Name<input value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/></label><div className="form2"><label>Type<select value={form.facility_type||'office'} onChange={e=>setForm({...form,facility_type:e.target.value})}><option>office</option><option>warehouse</option><option>medical</option><option>retail</option></select></label><label>Restrooms<input type="number" value={form.restroom_count||0} onChange={e=>setForm({...form,restroom_count:e.target.value})}/></label></div><div className="form2"><label>Floor type<input value={form.floor_type||''} onChange={e=>setForm({...form,floor_type:e.target.value})}/></label><label>Estimated minutes<input type="number" value={form.estimated_minutes||0} onChange={e=>setForm({...form,estimated_minutes:e.target.value})}/></label></div><label>Address<input value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})}/></label><label>Access and cleaning notes<textarea value={form.access_notes||''} onChange={e=>setForm({...form,access_notes:e.target.value})}/></label>{message&&<div className="notice">{message}</div>}<Button onClick={save}>{editing?'Save changes':'Create facility'}</Button></div></Modal></div>;
}

function EmployeesPage({data,companyId,reload}) {
  const blank={email:'',full_name:'',role:'employee',phone:'',customer_id:''};
  const [open,setOpen]=useState(false);
  const [form,setForm]=useState(blank);
  const [message,setMessage]=useState('');
  const [inviteLink,setInviteLink]=useState('');

  async function save() {
    if(!form.full_name.trim()) return setMessage('Full name is required.');
    if(!form.email.trim()) return setMessage('Email is required.');
    if(form.role==='customer'&&!form.customer_id) return setMessage('Select the customer this login belongs to.');

    const {data:invite,error}=await createPortalInvite(companyId,form);
    if(error) return setMessage(error.message);

    const link=`${window.location.origin}${window.location.pathname}?invite=${invite.token}`;
    setInviteLink(link);
    setMessage('Invitation created. Copy and send this link to the user.');
    await reload();
  }

  async function copyInvite(link){
    await navigator.clipboard.writeText(link);
    setMessage('Invitation link copied.');
  }

  async function revoke(invite){
    if(!confirm(`Revoke invitation for ${invite.email}?`)) return;
    const {error}=await revokePortalInvite(invite.id);
    if(error) return setMessage(error.message);
    await reload();
  }

  function openInvite(){
    setForm(blank); setInviteLink(''); setMessage(''); setOpen(true);
  }

  return <div className="page">
    <div className="pageHeader">
      <div>
        <p className="eyebrow">Team</p>
        <h1>Employees & portal access</h1>
        <p>Create a secure invitation link. The employee or customer chooses their own password.</p>
      </div>
      <Button onClick={openInvite}><Plus size={16}/> Invite user</Button>
    </div>

    {message&&<div className="notice">{message}</div>}

    <section className="panel">
      <div className="panelTitle"><h2>Active portal users</h2></div>
      {data.people.map(p=><div className="personRow" key={p.id}>
        <div className="avatar">{p.full_name?.slice(0,1)||'U'}</div>
        <div className="grow"><strong>{p.full_name||p.id}</strong><span>{p.role} · {p.phone||'No phone'}</span></div>
        <div className={`status ${p.status||'active'}`}>{p.status||'active'}</div>
      </div>)}
    </section>

    <section className="panel">
      <div className="panelTitle"><h2>Pending invitations</h2></div>
      {data.invites.filter(i=>i.status==='pending').map(invite=>{
        const link=`${window.location.origin}${window.location.pathname}?invite=${invite.token}`;
        return <div className="personRow" key={invite.id}>
          <div className="avatar">{invite.full_name?.slice(0,1)||'I'}</div>
          <div className="grow">
            <strong>{invite.full_name}</strong>
            <span>{invite.email} · {invite.role} · expires {new Date(invite.expires_at).toLocaleDateString()}</span>
          </div>
          <div className="rowActions">
            <button onClick={()=>copyInvite(link)}>Copy link</button>
            <button className="dangerText" onClick={()=>revoke(invite)}>Revoke</button>
          </div>
        </div>
      })}
      {!data.invites.some(i=>i.status==='pending')&&<p>No pending invitations.</p>}
    </section>

    <Modal open={open} title="Invite portal user" onClose={()=>setOpen(false)}>
      <div className="form">
        <label>Full name<input value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/></label>
        <div className="form2">
          <label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
          <label>Phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
        </div>
        <label>Role<select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
          <option value="employee">Employee</option>
          <option value="customer">Customer</option>
          <option value="manager">Manager</option>
        </select></label>
        {form.role==='customer'&&<label>Customer account<select value={form.customer_id} onChange={e=>setForm({...form,customer_id:e.target.value})}>
          <option value="">Select...</option>
          {data.customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select></label>}

        {!inviteLink
          ? <Button onClick={save}>Create invitation</Button>
          : <div className="inviteResult">
              <strong>Invitation ready</strong>
              <input readOnly value={inviteLink}/>
              <Button onClick={()=>copyInvite(inviteLink)}>Copy invitation link</Button>
            </div>}
        {message&&<div className="notice">{message}</div>}
      </div>
    </Modal>
  </div>;
}


function WorkOrdersPage({data,companyId,profile,reload}) {
  const blank={customer_id:'',facility_id:'',assigned_to_profile_id:'',title:'Routine Cleaning',scheduled_date:new Date().toISOString().slice(0,10),scheduled_time:'18:00',estimated_minutes:90,priority:'normal',instructions:'',area_names:'Reception, Restrooms, Kitchen, Offices'};
  const [open,setOpen]=useState(false);
  const [selected,setSelected]=useState(null);
  const [form,setForm]=useState(blank);
  const [message,setMessage]=useState('');
  const facilities=data.facilities.filter(f=>!form.customer_id||f.customer_id===form.customer_id);
  const employees=data.people.filter(p=>['employee','manager','owner'].includes(p.role));
  const customer=id=>data.customers.find(c=>c.id===id);
  const facility=id=>data.facilities.find(f=>f.id===id);
  const employee=id=>data.people.find(p=>p.id===id);

  async function save(){
    if(!form.customer_id||!form.facility_id||!form.scheduled_date)return setMessage('Customer, facility, and date are required.');
    const {error}=await createWorkOrder(companyId,form);
    if(error)return setMessage(error.message);
    setOpen(false);setForm(blank);await reload();
  }

  async function archive(order){
    if(!confirm(`Archive ${order.title}?`))return;
    const {error}=await archiveWorkOrder(order.id);
    if(error)return setMessage(error.message);
    setSelected(null);await reload();
  }

  if(selected){
    const areas=data.workOrderAreas.filter(a=>a.work_order_id===selected.id);
    const completed=areas.filter(a=>a.status==='completed').length;
    const progress=areas.length?Math.round(completed/areas.length*100):0;
    return <div className="page">
      <button className="back" onClick={()=>setSelected(null)}><ArrowLeft size={18}/> Work Orders</button>
      <div className="missionHero"><div><p className="eyebrow">Work Order</p><h1>{selected.title}</h1><p>{customer(selected.customer_id)?.name} · {facility(selected.facility_id)?.name}</p></div><div className={`status ${selected.status}`}>{selected.status}</div></div>
      <div className="stats">
        <Stat icon={CalendarDays} label="Scheduled" value={selected.scheduled_date} note={selected.scheduled_time||'No time'}/>
        <Stat icon={CircleUserRound} label="Assigned" value={employee(selected.assigned_to_profile_id)?.full_name||'Unassigned'} note="Employee"/>
        <Stat icon={Clock} label="Estimate" value={`${selected.estimated_minutes||0} min`} note="Planned duration"/>
        <Stat icon={CheckCircle2} label="Progress" value={`${progress}%`} note={`${completed}/${areas.length} areas`}/>
      </div>
      <div className="grid2">
        <section className="panel"><div className="panelTitle"><h2>Areas</h2><span>{completed}/{areas.length}</span></div>{areas.map(area=><div className="areaAdminRow" key={area.id}><div><strong>{area.name}</strong><span>{area.status}</span></div><div className={`status ${area.status}`}>{area.status}</div></div>)}{!areas.length&&<Empty title="No areas" text="Add areas when creating the work order."/>}</section>
        <section className="panel"><h2>Instructions</h2><p>{selected.instructions||facility(selected.facility_id)?.access_notes||'No special instructions.'}</p><Button variant="ghost" onClick={()=>archive(selected)}>Archive</Button></section>
      </div>
    </div>;
  }

  return <div className="page">
    <div className="pageHeader"><div><p className="eyebrow">Operations Engine</p><h1>Work Orders</h1><p>Schedule, assign, execute, and verify each cleaning mission.</p></div><Button onClick={()=>{setForm(blank);setMessage('');setOpen(true)}}><Plus size={16}/> New work order</Button></div>
    {message&&<div className="notice">{message}</div>}
    <div className="workOrderGrid">{data.workOrders.map(order=><button className="workOrderCard" key={order.id} onClick={()=>setSelected(order)}><div className="objectHead"><div className="objectIcon"><ClipboardCheck size={21}/></div><div className={`status ${order.status}`}>{order.status}</div></div><p className="eyebrow">{order.scheduled_date} · {order.scheduled_time||'Any time'}</p><h2>{order.title}</h2><p>{customer(order.customer_id)?.name} · {facility(order.facility_id)?.name}</p><div className="miniStats"><span><b>{employee(order.assigned_to_profile_id)?.full_name||'Unassigned'}</b></span><span><b>{order.estimated_minutes||0}</b> min</span></div></button>)}{!data.workOrders.length&&<Empty title="No work orders" text="Create the first mission for a facility."/>}</div>
    <Modal open={open} title="New work order" onClose={()=>setOpen(false)}><div className="form">
      <label>Customer<select value={form.customer_id} onChange={e=>setForm({...form,customer_id:e.target.value,facility_id:''})}><option value="">Select...</option>{data.customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Facility<select value={form.facility_id} onChange={e=>setForm({...form,facility_id:e.target.value})}><option value="">Select...</option>{facilities.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
      <label>Title<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>
      <div className="form2"><label>Date<input type="date" value={form.scheduled_date} onChange={e=>setForm({...form,scheduled_date:e.target.value})}/></label><label>Time<input type="time" value={form.scheduled_time} onChange={e=>setForm({...form,scheduled_time:e.target.value})}/></label></div>
      <div className="form2"><label>Employee<select value={form.assigned_to_profile_id} onChange={e=>setForm({...form,assigned_to_profile_id:e.target.value})}><option value="">Unassigned</option>{employees.map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}</select></label><label>Estimated minutes<input type="number" value={form.estimated_minutes} onChange={e=>setForm({...form,estimated_minutes:e.target.value})}/></label></div>
      <label>Areas<input value={form.area_names} onChange={e=>setForm({...form,area_names:e.target.value})}/></label>
      <label>Instructions<textarea value={form.instructions} onChange={e=>setForm({...form,instructions:e.target.value})}/></label>
      {message&&<div className="notice">{message}</div>}<Button onClick={save}>Create work order</Button>
    </div></Modal>
  </div>;
}

function EmployeeWorkOrders({profile,data,reload}) {
  const [selected,setSelected]=useState(null);
  const [supplyId,setSupplyId]=useState('');
  const [quantity,setQuantity]=useState(1);
  const [message,setMessage]=useState('');
  const today=new Date().toISOString().slice(0,10);
  const mine=data.workOrders.filter(order=>order.assigned_to_profile_id===profile.id&&order.status!=='archived'&&order.scheduled_date>=today);

  async function start(order){const {error}=await startWorkOrder(order.id,profile.company_id,profile.id);if(error)return setMessage(error.message);await reload();setSelected({...order,status:'in_progress'});}
  async function toggleArea(area){const next=area.status==='completed'?'pending':'completed';const {error}=await updateWorkOrderArea(area.id,{status:next,started_at:area.started_at||new Date().toISOString(),completed_at:next==='completed'?new Date().toISOString():null});if(error)return setMessage(error.message);await reload();}
  async function useSupply(){const {error}=await recordSupplyUsage(profile.company_id,selected.id,selected.facility_id,supplyId,quantity,profile.id);if(error)return setMessage(error.message);setMessage('Supply usage recorded.');setSupplyId('');setQuantity(1);await reload();}
  async function finish(){const areas=data.workOrderAreas.filter(a=>a.work_order_id===selected.id);if(areas.length&&areas.some(a=>a.status!=='completed'))return setMessage('Complete every area before submitting.');const {error}=await finishWorkOrder(selected.id);if(error)return setMessage(error.message);setMessage('Mission submitted for verification.');await reload();}

  if(selected){
    const current=data.workOrders.find(o=>o.id===selected.id)||selected;
    const areas=data.workOrderAreas.filter(a=>a.work_order_id===current.id);
    const facility=data.facilities.find(f=>f.id===current.facility_id);
    const inventory=data.inventory.filter(i=>i.facility_id===current.facility_id);
    return <div className="page missionPage">
      <button className="back" onClick={()=>setSelected(null)}><ArrowLeft size={18}/> Today</button>
      <div className="missionHero"><div><p className="eyebrow">Today's Mission</p><h1>{current.title}</h1><p>{facility?.name} · {current.scheduled_time}</p></div><div className={`status ${current.status}`}>{current.status}</div></div>
      <section className="infoStrip"><Clock size={18}/><div><strong>{current.estimated_minutes||90} minutes</strong><span>{current.instructions||facility?.access_notes||'Follow the checklist.'}</span></div></section>
      {current.status==='scheduled'&&<Button onClick={()=>start(current)}>Start mission</Button>}
      <section className="panel"><div className="panelTitle"><h2>Area workflow</h2><span>{areas.filter(a=>a.status==='completed').length}/{areas.length}</span></div>{areas.map(area=><label className="task" key={area.id}><input type="checkbox" checked={area.status==='completed'} onChange={()=>toggleArea(area)}/><div><strong>{area.name}</strong><span>{area.status==='completed'?'Completed':'Tap when complete'}</span></div></label>)}</section>
      <section className="panel"><h2>Supplies used</h2><div className="form2"><label>Supply<select value={supplyId} onChange={e=>setSupplyId(e.target.value)}><option value="">Select...</option>{inventory.map(item=>{const supply=data.supplies.find(s=>s.id===item.supply_item_id);return <option key={item.id} value={item.supply_item_id}>{supply?.name||'Supply'} — {item.quantity||0}</option>})}</select></label><label>Quantity<input type="number" min="1" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label></div><Button variant="secondary" onClick={useSupply}>Record usage</Button></section>
      <Button onClick={finish}><CheckCircle2 size={17}/> Submit mission</Button>{message&&<div className="notice">{message}</div>}
    </div>;
  }

  return <div className="page"><div className="pageHeader"><div><p className="eyebrow">Employee Portal</p><h1>Today's missions</h1><p>Complete each assigned work order area by area.</p></div></div><div className="missionCards">{mine.map(order=>{const facility=data.facilities.find(f=>f.id===order.facility_id);return <button className="missionCard" key={order.id} onClick={()=>setSelected(order)}><div className="missionTime">{order.scheduled_date} · {order.scheduled_time||'Any time'}</div><h2>{order.title}</h2><p>{facility?.name}</p><div className={`status ${order.status}`}>{order.status}</div></button>})}{!mine.length&&<Empty title="No assigned work orders" text="Assigned missions will appear here."/>}</div></div>;
}

function ModulePlaceholder({title,description}){return <div className="page"><div className="pageHeader"><div><p className="eyebrow">FacilityOS module</p><h1>{title}</h1><p>{description}</p></div></div><section className="panel"><Empty title={`${title} workspace`} text="The navigation and data foundation are active. This module is ready for its detailed workflow in the next operational release."/></section></div>}

function CalendarPage({data,companyId,reload}) {
  const [planOpen,setPlanOpen]=useState(false);
  const [selectedPlan,setSelectedPlan]=useState(null);
  const [mission,setMission]=useState(null);
  const [form,setForm]=useState({customer_id:'',facility_id:'',name:'Weekly Cleaning',frequency:'weekly',weekdays:[6],start_date:new Date().toISOString().slice(0,10),default_time:'09:00',assigned_to_profile_id:'',estimated_minutes:90,visit_price:0});
  const [message,setMessage]=useState('');

  const facilities=data.facilities.filter(f=>!form.customer_id||f.customer_id===form.customer_id);
  const employees=data.people.filter(p=>p.role==='employee'||p.role==='manager');

  async function savePlan() {
    const {data:plan,error}=await createServicePlan(companyId,form);
    if(error) return setMessage(error.message);
    setPlanOpen(false); setSelectedPlan(plan); reload();
  }

  async function generate(plan) {
    setMessage('');
    const {error}=await generateVisits(companyId,plan,12);
    if(error) return setMessage(error.message);
    setMessage('Generated the next 12 months of visits.');
    reload();
  }

  return <div className="page">
    <div className="pageHeader"><div><p className="eyebrow">Planning</p><h1>Calendar & recurring services</h1><p>Create a service plan once and generate the year.</p></div><Button onClick={()=>setPlanOpen(true)}><Plus size={16}/> New service plan</Button></div>
    {message&&<div className="notice">{message}</div>}
    <div className="grid2">
      <section className="panel">
        <div className="panelTitle"><h2>Service plans</h2></div>
        {data.plans.map(p=><div className="planRow" key={p.id}><div><strong>{p.name}</strong><span>{p.frequency} · {p.default_time} · ${p.visit_price||0}/visit</span></div><Button variant="secondary" onClick={()=>generate(p)}>Generate 12 months</Button></div>)}
        {!data.plans.length&&<Empty title="No service plans" text="Create your first recurring plan."/>}
      </section>
      <section className="panel">
        <div className="panelTitle"><h2>Upcoming visits</h2></div>
        <div className="rows">{data.visits.slice(0,12).map(v=><VisitRow key={v.id} visit={v} data={data} onOpen={setMission}/>)}</div>
      </section>
    </div>
    <Modal open={planOpen} title="New recurring service plan" onClose={()=>setPlanOpen(false)}><div className="form">
      <label>Customer<select value={form.customer_id} onChange={e=>setForm({...form,customer_id:e.target.value,facility_id:''})}><option value="">Select...</option>{data.customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Facility<select value={form.facility_id} onChange={e=>setForm({...form,facility_id:e.target.value})}><option value="">Select...</option>{facilities.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
      <label>Plan name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
      <div className="form2"><label>Frequency<select value={form.frequency} onChange={e=>setForm({...form,frequency:e.target.value})}><option value="weekly">Weekly</option><option value="biweekly">Every 2 weeks</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option></select></label><label>Start date<input type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})}/></label></div>
      <div className="form2"><label>Default time<input type="time" value={form.default_time} onChange={e=>setForm({...form,default_time:e.target.value})}/></label><label>Employee<select value={form.assigned_to_profile_id} onChange={e=>setForm({...form,assigned_to_profile_id:e.target.value})}><option value="">Unassigned</option>{employees.map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}</select></label></div>
      <div className="form2"><label>Estimated minutes<input type="number" value={form.estimated_minutes} onChange={e=>setForm({...form,estimated_minutes:e.target.value})}/></label><label>Price per visit<input type="number" value={form.visit_price} onChange={e=>setForm({...form,visit_price:e.target.value})}/></label></div>
      <label>Weekdays<select multiple value={form.weekdays.map(String)} onChange={e=>setForm({...form,weekdays:Array.from(e.target.selectedOptions).map(o=>Number(o.value))})}><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option><option value="0">Sunday</option></select></label>
      <Button onClick={savePlan}>Create plan</Button>
    </div></Modal>
    <Modal open={!!mission} title="Mission details" onClose={()=>setMission(null)}>{mission&&<AdminMission visit={mission} data={data} reload={reload}/>}</Modal>
  </div>;
}

function AdminMission({visit,data,reload}) {
  const [message,setMessage]=useState('');
  const tasks=data.tasks.filter(t=>t.service_visit_id===visit.id);
  const proof=data.proof.filter(p=>p.service_visit_id===visit.id);

  async function markVerified() {
    const incomplete=tasks.some(t=>t.status!=='completed');
    const before=proof.some(p=>p.proof_type==='before');
    const after=proof.some(p=>p.proof_type==='after');
    if(incomplete||!before||!after) return setMessage('Cannot verify until all tasks and before/after proof are complete.');
    await updateVisit(visit.id,{status:'completed',verification_status:'verified',completed_at:new Date().toISOString()});
    setMessage('Mission verified.'); reload();
  }

  return <div className="missionAdmin">
    <div className="missionProgress"><strong>{tasks.filter(t=>t.status==='completed').length}/{tasks.length}</strong><span>tasks complete</span></div>
    <div className="proofGrid">{proof.map(p=><img src={p.file_url} key={p.id}/>)}</div>
    {message&&<div className="notice">{message}</div>}
    <Button onClick={markVerified}><ShieldCheck size={17}/> Verify mission</Button>
  </div>;
}

function IssuesPage({data}) {
  return <div className="page"><div className="pageHeader"><div><p className="eyebrow">Facility intelligence</p><h1>Issues</h1><p>Problems reported by employees and customers.</p></div></div><section className="panel">{data.issues.map(i=><div className="issueRow" key={i.id}><div className={`priority ${i.priority}`}/><div><strong>{i.title}</strong><span>{i.description||'No description'}</span></div><div className={`status ${i.status}`}>{i.status}</div></div>)}{!data.issues.length&&<Empty title="No issues" text="Reported problems will appear here."/>}</section></div>;
}


function SuppliesPage({data,companyId,reload}) {
  const [itemOpen,setItemOpen]=useState(false);
  const [stockOpen,setStockOpen]=useState(false);
  const [item,setItem]=useState({name:'',category:'cleaning',unit:'each',default_reorder_level:2,unit_cost:0});
  const [stock,setStock]=useState({facility_id:'',supply_item_id:'',quantity_on_hand:0,reorder_level:2,target_level:6,storage_location:'',notes:''});
  const [message,setMessage]=useState('');

  async function saveItem(){ const {error}=await createSupplyItem(companyId,item); if(error)return setMessage(error.message); setItemOpen(false); reload(); }
  async function saveStock(){ const {error}=await upsertFacilityInventory(companyId,stock); if(error)return setMessage(error.message); setStockOpen(false); reload(); }
  async function changeQty(row,delta){ const next=Math.max(0,Number(row.quantity_on_hand||0)+delta); const {error}=await adjustFacilityInventory(row.id,next); if(error)return setMessage(error.message); reload(); }

  return <div className="page">
    <div className="pageHeader"><div><p className="eyebrow">Facility supplies</p><h1>Supplies inventory</h1><p>Track chemicals, liners, paper products, soap, and consumables at each facility.</p></div><div className="buttonRow"><Button variant="secondary" onClick={()=>setItemOpen(true)}><Plus size={16}/> Supply item</Button><Button onClick={()=>setStockOpen(true)}><PackageOpen size={16}/> Add facility stock</Button></div></div>
    {message&&<div className="notice">{message}</div>}
    <div className="stats"><Stat icon={PackageOpen} label="Supply items" value={data.supplies.length} note="Active catalog"/><Stat icon={Building2} label="Stocked facilities" value={new Set(data.inventory.map(x=>x.facility_id)).size} note="With inventory"/><Stat icon={AlertTriangle} label="Low stock" value={data.inventory.filter(x=>Number(x.quantity_on_hand)<=Number(x.reorder_level)).length} note="Needs reorder" tone="pastelYellow"/><Stat label="Inventory value" value={`$${data.inventory.reduce((sum,row)=>{const i=data.supplies.find(x=>x.id===row.supply_item_id);return sum+Number(row.quantity_on_hand||0)*Number(i?.unit_cost||0)},0).toFixed(2)}`} note="Estimated" tone="pastelGreen"/></div>
    <section className="panel"><div className="panelTitle"><h2>Inventory by facility</h2></div>{data.facilities.map(f=>{const rows=data.inventory.filter(x=>x.facility_id===f.id);return <div className="inventoryFacility" key={f.id}><h3>{f.name}</h3>{rows.map(row=>{const supply=data.supplies.find(x=>x.id===row.supply_item_id);const low=Number(row.quantity_on_hand)<=Number(row.reorder_level);return <div className="inventoryRow" key={row.id}><div><strong>{supply?.name||'Supply'}</strong><span>{row.storage_location||'No location'} · target {row.target_level||0} {supply?.unit||''}</span></div><div className={low?'stockBadge low':'stockBadge'}>{row.quantity_on_hand} {supply?.unit||''}</div><div className="qtyControls"><button onClick={()=>changeQty(row,-1)}>−</button><button onClick={()=>changeQty(row,1)}>+</button></div></div>})}{!rows.length&&<p>No supplies assigned.</p>}</div>})}</section>
    <Modal open={itemOpen} title="New supply item" onClose={()=>setItemOpen(false)}><div className="form"><label>Name<input value={item.name} onChange={e=>setItem({...item,name:e.target.value})}/></label><div className="form2"><label>Category<input value={item.category} onChange={e=>setItem({...item,category:e.target.value})}/></label><label>Unit<select value={item.unit} onChange={e=>setItem({...item,unit:e.target.value})}><option>each</option><option>roll</option><option>case</option><option>gallon</option><option>liter</option><option>box</option></select></label></div><div className="form2"><label>Default reorder level<input type="number" value={item.default_reorder_level} onChange={e=>setItem({...item,default_reorder_level:e.target.value})}/></label><label>Unit cost<input type="number" step="0.01" value={item.unit_cost} onChange={e=>setItem({...item,unit_cost:e.target.value})}/></label></div><Button onClick={saveItem}>Save supply</Button></div></Modal>
    <Modal open={stockOpen} title="Add facility stock" onClose={()=>setStockOpen(false)}><div className="form"><label>Facility<select value={stock.facility_id} onChange={e=>setStock({...stock,facility_id:e.target.value})}><option value="">Select...</option>{data.facilities.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label><label>Supply<select value={stock.supply_item_id} onChange={e=>setStock({...stock,supply_item_id:e.target.value})}><option value="">Select...</option>{data.supplies.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select></label><div className="form2"><label>Quantity on hand<input type="number" value={stock.quantity_on_hand} onChange={e=>setStock({...stock,quantity_on_hand:e.target.value})}/></label><label>Reorder level<input type="number" value={stock.reorder_level} onChange={e=>setStock({...stock,reorder_level:e.target.value})}/></label></div><div className="form2"><label>Target level<input type="number" value={stock.target_level} onChange={e=>setStock({...stock,target_level:e.target.value})}/></label><label>Storage location<input value={stock.storage_location} onChange={e=>setStock({...stock,storage_location:e.target.value})}/></label></div><label>Notes<textarea value={stock.notes} onChange={e=>setStock({...stock,notes:e.target.value})}/></label><Button onClick={saveStock}>Save facility stock</Button></div></Modal>
  </div>;
}

function SettingsPage({companyId,reload}) {
  const [message,setMessage]=useState('');
  const [checks,setChecks]=useState([]);
  const [checking,setChecking]=useState(false);

  async function loadMIP() {
    const {error}=await seedMIP(companyId);
    setMessage(error?error.message:'MIP customer, facility, and weekly plan were created.');
    reload();
  }

  async function runHealthCheck(){
    setChecking(true);setMessage('');
    try{setChecks(await checkInfrastructure())}
    catch(error){setMessage(error.message)}
    finally{setChecking(false)}
  }

  return <div className="page">
    <div className="pageHeader"><div><p className="eyebrow">Workspace</p><h1>Settings & system health</h1><p>Initialize operating data and confirm Supabase infrastructure.</p></div><Button variant="secondary" onClick={runHealthCheck}>{checking?'Checking…':'Run system check'}</Button></div>
    {message&&<div className="notice">{message}</div>}
    <div className="grid2">
      <section className="panel schemaLockCard">
  <div className="panelTitle"><div><p className="eyebrow">Architecture lock</p><h2>FacilityOS Canonical Schema v2.0</h2></div><div className="status active">locked</div></div>
  <p>All future releases use the same table names. Existing production tables are preserved and duplicate concepts are no longer introduced.</p>
  <div className="schemaChips">
    <span>customers</span><span>customer_contacts</span><span>facilities</span>
    <span>facility_supply_inventory</span><span>service_plans</span><span>service_visits</span>
    <span>mission_tasks</span><span>visit_proof</span><span>facility_issues</span>
    <span>quotes</span><span>invoices</span><span>payments</span>
  </div>
</section>
<section className="panel"><h2>MIP starter profile</h2><p>Creates MIP Cargo Express, its office facility, 3 restrooms, LVP floors, 150-minute estimate, and weekly cleaning plan.</p><Button onClick={loadMIP}>Load MIP starter profile</Button></section>
      <section className="panel"><h2>Secure user management</h2><p>Employee and customer logins require two Supabase Edge Functions. The function code and deployment script are included in this release.</p><div className="codeBlock">bash scripts/deploy-supabase.sh</div><p className="smallText">Run this once from the project root. It logs into Supabase, links the project, deploys both functions, and prints the next steps.</p></section>
    </div>
    <section className="panel"><div className="panelTitle"><div><h2>Infrastructure status</h2><p>Database, storage, and secure function readiness.</p></div></div>{checks.length? <div className="healthGrid">{checks.map(check=><div className={check.ok?'healthItem ok':'healthItem bad'} key={check.key}><div className="healthDot"/><div><strong>{check.label}</strong><span>{check.type} · {check.message}</span></div></div>)}</div>:<Empty title="System check not run" text="Run the check to confirm tables, photo storage, and secure user creation."/>}</section>
  </div>;
}
function EmployeeHome({profile,data,reload}) {
  const [mission,setMission]=useState(null);
  const today=new Date().toISOString().slice(0,10);
  const mine=data.visits.filter(v=>v.assigned_to_profile_id===profile.id);
  const todayMine=mine.filter(v=>v.scheduled_date===today);

  if(mission) return <EmployeeMission profile={profile} visit={mission} data={data} reload={reload} onBack={()=>setMission(null)}/>;

  return <div className="page">
    <div className="pageHeader"><div><p className="eyebrow">Employee portal</p><h1>Today’s missions</h1><p>Complete each mission with checklist and photo proof.</p></div></div>
    <div className="missionCards">
      {todayMine.map(v=><button className="missionCard" key={v.id} onClick={()=>setMission(v)}><div className="missionTime">{v.scheduled_time||'—'}</div><h2>{v.title}</h2><p>{data.facilities.find(f=>f.id===v.facility_id)?.name}</p><div className={`status ${v.status}`}>{v.status}</div></button>)}
      {!todayMine.length&&<Empty title="No missions today" text="Assigned work will appear here."/>}
    </div>
    <section className="panel"><h2>Upcoming</h2>{mine.filter(v=>v.scheduled_date>today).slice(0,8).map(v=><VisitRow key={v.id} visit={v} data={data} onOpen={setMission}/>)}</section>
  </div>;
}

function EmployeeMission({profile,visit,data,reload,onBack}) {
  const [message,setMessage]=useState('');
  const [issueOpen,setIssueOpen]=useState(false);
  const [issue,setIssue]=useState({title:'',description:'',priority:'medium'});
  const tasks=data.tasks.filter(t=>t.service_visit_id===visit.id);
  const proof=data.proof.filter(p=>p.service_visit_id===visit.id);
  const facility=data.facilities.find(f=>f.id===visit.facility_id);

  async function begin() {
    await updateVisit(visit.id,{status:'in_progress',check_in_at:new Date().toISOString()}); reload();
  }
  async function doTask(task) { await toggleTask(task); reload(); }
  async function fileChange(e,type) {
    const file=e.target.files?.[0]; if(!file) return;
    const {error}=await uploadProof(profile.company_id,visit.id,profile.id,file,type);
    setMessage(error?error.message:`${type} photo uploaded.`); reload();
  }
  async function submitIssue() {
    const {error}=await createIssue(profile.company_id,{...issue,customer_id:visit.customer_id,facility_id:visit.facility_id,service_visit_id:visit.id},profile.id);
    if(error) return setMessage(error.message);
    setIssueOpen(false); setIssue({title:'',description:'',priority:'medium'}); reload();
  }
  async function finish() {
    const allDone=tasks.length&&tasks.every(t=>t.status==='completed');
    const hasBefore=proof.some(p=>p.proof_type==='before');
    const hasAfter=proof.some(p=>p.proof_type==='after');
    if(!allDone||!hasBefore||!hasAfter) return setMessage('Complete all tasks and upload at least one before and one after photo.');
    await updateVisit(visit.id,{status:'awaiting_verification',verification_status:'pending',check_out_at:new Date().toISOString()});
    setMessage('Mission submitted for manager verification.'); reload();
  }

  return <div className="page missionPage">
    <button className="back" onClick={onBack}><ArrowLeft size={18}/> Back</button>
    <div className="missionHero"><div><p className="eyebrow">Mission</p><h1>{visit.title}</h1><p>{facility?.name} · {visit.scheduled_time}</p></div><div className={`status ${visit.status}`}>{visit.status}</div></div>
    <section className="infoStrip"><Clock size={18}/><div><strong>{visit.estimated_minutes||facility?.estimated_minutes||90} minutes</strong><span>{facility?.access_notes||'No access notes'}</span></div></section>
    {visit.status==='scheduled'&&<Button onClick={begin}>Check in and start</Button>}
    <div className="proofUploadGrid">
      <label className="uploadTile"><Camera size={28}/><strong>Before photos</strong><span>{proof.filter(p=>p.proof_type==='before').length} uploaded</span><input type="file" accept="image/*" capture="environment" onChange={e=>fileChange(e,'before')}/></label>
      <label className="uploadTile"><Camera size={28}/><strong>After photos</strong><span>{proof.filter(p=>p.proof_type==='after').length} uploaded</span><input type="file" accept="image/*" capture="environment" onChange={e=>fileChange(e,'after')}/></label>
    </div>
    <section className="panel"><div className="panelTitle"><h2>Checklist</h2><span>{tasks.filter(t=>t.status==='completed').length}/{tasks.length}</span></div>{tasks.map(t=><label className="task" key={t.id}><input type="checkbox" checked={t.status==='completed'} onChange={()=>doTask(t)}/><div><strong>{t.title}</strong>{t.requires_proof&&<span>Proof required</span>}</div></label>)}</section>
    <div className="buttonRow"><Button variant="secondary" onClick={()=>setIssueOpen(true)}><AlertTriangle size={17}/> Report issue</Button><Button onClick={finish}><CheckCircle2 size={17}/> Submit mission</Button></div>
    {message&&<div className="notice">{message}</div>}
    <Modal open={issueOpen} title="Report facility issue" onClose={()=>setIssueOpen(false)}><div className="form"><label>Title<input value={issue.title} onChange={e=>setIssue({...issue,title:e.target.value})}/></label><label>Description<textarea value={issue.description} onChange={e=>setIssue({...issue,description:e.target.value})}/></label><label>Priority<select value={issue.priority} onChange={e=>setIssue({...issue,priority:e.target.value})}><option>low</option><option>medium</option><option>high</option><option>urgent</option></select></label><Button onClick={submitIssue}>Submit issue</Button></div></Modal>
  </div>;
}

function CustomerHome({profile,data}) {
  const customer=data.customers.find(c=>c.id===profile.customer_id);
  const facilities=data.facilities.filter(f=>f.customer_id===profile.customer_id);
  const visits=data.visits.filter(v=>v.customer_id===profile.customer_id);
  const completed=visits.filter(v=>v.verification_status==='verified');
  const upcoming=visits.filter(v=>v.status==='scheduled').slice(0,5);
  const issues=data.issues.filter(i=>i.customer_id===profile.customer_id&&i.status!=='closed');

  return <div className="page">
    <div className="pageHeader"><div><p className="eyebrow">Customer portal</p><h1>Welcome, {customer?.name||profile.full_name}.</h1><p>See upcoming service, verified proof, and facility issues.</p></div></div>
    <div className="stats"><Stat icon={CalendarDays} label="Upcoming visits" value={upcoming.length} note="Scheduled"/><Stat icon={CheckCircle2} label="Verified services" value={completed.length} note="Completed"/><Stat icon={Building2} label="Facilities" value={facilities.length} note="Managed"/><Stat icon={AlertTriangle} label="Open issues" value={issues.length} note="In progress"/></div>
    <div className="grid2"><section className="panel"><h2>Upcoming service</h2>{upcoming.map(v=><VisitRow key={v.id} visit={v} data={data}/>)}</section><section className="darkCard"><ShieldCheck size={24}/><h2>Proof of service</h2><p>Completed visits become visible after manager verification.</p></section></div>
  </div>;
}

function CustomerProof({profile,data}) {
  const visits=data.visits.filter(v=>v.customer_id===profile.customer_id&&v.verification_status==='verified');
  return <div className="page"><div className="pageHeader"><div><p className="eyebrow">Verified work</p><h1>Service proof</h1><p>Before and after photos for completed visits.</p></div></div>{visits.map(v=>{const proof=data.proof.filter(p=>p.service_visit_id===v.id);return <section className="panel" key={v.id}><div className="panelTitle"><div><h2>{v.title}</h2><p>{v.scheduled_date}</p></div><div className="status completed">verified</div></div><div className="proofGrid">{proof.map(p=><figure key={p.id}><img src={p.file_url}/><figcaption>{p.proof_type}</figcaption></figure>)}</div></section>})}{!visits.length&&<Empty title="No verified services yet" text="Completed and verified missions will appear here."/>}</div>;
}

function CustomerRequests({profile,data,reload}) {
  const [open,setOpen]=useState(false);
  const [form,setForm]=useState({facility_id:'',request_type:'additional_service',title:'',description:''});
  const [message,setMessage]=useState('');
  const facilities=data.facilities.filter(f=>f.customer_id===profile.customer_id);
  async function save() {
    const {error}=await createCustomerRequest(profile.company_id,profile,form);
    if(error) return setMessage(error.message);
    setOpen(false); reload();
  }
  const requests=data.requests.filter(r=>r.customer_id===profile.customer_id);
  return <div className="page"><div className="pageHeader"><div><p className="eyebrow">Customer requests</p><h1>Request service</h1><p>Ask for additional cleaning or report a need.</p></div><Button onClick={()=>setOpen(true)}><Plus size={16}/> New request</Button></div><section className="panel">{requests.map(r=><div className="issueRow" key={r.id}><Wrench size={18}/><div><strong>{r.title}</strong><span>{r.description}</span></div><div className={`status ${r.status}`}>{r.status}</div></div>)}{!requests.length&&<Empty title="No requests" text="Your requests will appear here."/>}</section><Modal open={open} title="New service request" onClose={()=>setOpen(false)}><div className="form"><label>Facility<select value={form.facility_id} onChange={e=>setForm({...form,facility_id:e.target.value})}><option value="">Select...</option>{facilities.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label><label>Type<select value={form.request_type} onChange={e=>setForm({...form,request_type:e.target.value})}><option value="additional_service">Additional service</option><option value="issue">Report issue</option><option value="schedule_change">Schedule change</option></select></label><label>Title<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label>Description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>{message&&<div className="notice">{message}</div>}<Button onClick={save}>Submit request</Button></div></Modal></div>;
}

export function App() {
  const inviteToken=new URLSearchParams(window.location.search).get('invite');
  const [session,setSession]=useState(null);
  const [profile,setProfile]=useState(null);
  const [data,setData]=useState(empty);
  const [loading,setLoading]=useState(true);
  const [portal,setPortal]=useState('admin');
  const [page,setPage]=useState('overview');

  async function bootstrap() {
    setLoading(true);
    try {
      if(!supabase){ setSession(null); setProfile(null); setData(empty); return; }
      const timeout = new Promise((_,reject)=>setTimeout(()=>reject(new Error('Supabase startup timed out.')),10000));
      const sessionResult=await Promise.race([supabase.auth.getSession(),timeout]);
      const currentSession=sessionResult?.data?.session||null;
      setSession(currentSession);
      if(!currentSession?.user){ setProfile(null); setData(empty); return; }
      let p=await Promise.race([getMyProfile(currentSession.user.id),timeout]);
      if(inviteToken && !p){
        const claim=await claimPortalInvite(inviteToken);
        if(claim.error) console.error('Invitation claim error:',claim.error);
        p=await Promise.race([getMyProfile(currentSession.user.id),timeout]);
      }
      setProfile(p);
      if(!p){ setData(empty); return; }
      const rolePortal=p.role==='customer'?'customer':p.role==='employee'?'employee':'admin';
      setPortal(rolePortal);
      setPage(rolePortal==='admin'?'overview':rolePortal==='employee'?'employee-home':'customer-home');
      const workspace=await Promise.race([loadWorkspace(p),timeout]);
      setData(workspace||empty);
    } catch(error) {
      console.error('FacilityOS bootstrap error:',error);
      setSession(null); setProfile(null); setData(empty);
    } finally {
      setLoading(false);
    }
  }

  async function reload() {
    const p=await getMyProfile(session.user.id);
    setProfile(p);
    if(p) setData(await loadWorkspace(p));
  }

  useEffect(()=>{bootstrap(); if(supabase){const {data:l}=supabase.auth.onAuthStateChange(()=>bootstrap());return()=>l.subscription.unsubscribe();}},[]);

  if(loading) return <div className="loading">Loading FacilityOS…</div>;
  if(!session) return <Login onReady={bootstrap} inviteToken={inviteToken}/>;
  if(!profile?.company_id) return <Setup session={session} onDone={reload}/>;

  let content;
  if(portal==='admin') {
    if(page==='overview') content=<AdminOverview data={data} setPage={setPage}/>;
    else if(page==='customers') content=<CustomersPage data={data} companyId={profile.company_id} reload={reload}/>;
    else if(page==='contacts') content=<ContactsPage data={data} companyId={profile.company_id} reload={reload}/>;
    else if(page==='facilities') content=<FacilitiesPage data={data} companyId={profile.company_id} reload={reload}/>;
    else if(page==='work-orders') content=<WorkOrdersPage data={data} companyId={profile.company_id} profile={profile} reload={reload}/>;
    else if(page==='calendar') content=<CalendarPage data={data} companyId={profile.company_id} reload={reload}/>;
    else if(page==='employees') content=<EmployeesPage data={data} companyId={profile.company_id} reload={reload}/>;
    else if(page==='issues') content=<IssuesPage data={data}/>;
    else if(page==='supplies') content=<SuppliesPage data={data} companyId={profile.company_id} reload={reload}/>;
    else if(page==='work-orders') content=<CalendarPage data={data} companyId={profile.company_id} reload={reload}/>;
    else if(page==='quotes') content=<ModulePlaceholder title="Quotes" description="Create customer proposals and convert accepted quotes into work orders."/>;
    else if(page==='inspections') content=<ModulePlaceholder title="Inspections" description="Facility inspections, scoring, findings, and corrective actions."/>;
    else if(page==='invoices') content=<ModulePlaceholder title="Invoices" description="Bill recurring and additional services and share invoices with customers."/>;
    else if(page==='payments') content=<ModulePlaceholder title="Payments" description="Track received and outstanding customer payments."/>;
    else if(page==='payroll') content=<ModulePlaceholder title="Payroll" description="Track employee hours, pay rates, and payroll periods."/>;
    else if(page==='expenses') content=<ModulePlaceholder title="Expenses" description="Record supplies, mileage, subcontractors, and operating expenses."/>;
    else if(page==='billing') content=<ModulePlaceholder title="Billing & Subscriptions" description="Manage customer recurring billing now and FacilityOS SaaS subscriptions later."/>;
    else if(page==='contractors') content=<ModulePlaceholder title="Contractors" description="Manage outsourced cleaners, plumbers, electricians, and other service partners."/>;
    else if(page==='reports') content=<ModulePlaceholder title="Reports" description="Operations, proof-of-service, customer, financial, and employee performance reports."/>;
    else content=<SettingsPage companyId={profile.company_id} reload={reload}/>;
  } else if(portal==='employee') {
    content=<EmployeeWorkOrders profile={profile} data={data} reload={reload}/>;
  } else {
    if(page==='customer-proof') content=<CustomerProof profile={profile} data={data}/>;
    else if(page==='customer-requests') content=<CustomerRequests profile={profile} data={data} reload={reload}/>;
    else content=<CustomerHome profile={profile} data={data}/>;
  }

  return <Shell profile={profile} portal={portal} setPortal={setPortal} page={page} setPage={setPage}>{content}</Shell>;
}
