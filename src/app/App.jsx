import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, Bell, Building2, CalendarDays, Camera, CheckCircle2,
  ChevronRight, CircleUserRound, ClipboardCheck, Clock, FileText, Home, Image, PackageOpen,
  LogOut, Menu, Plus, Search, Settings, ShieldCheck, Sparkles, UsersRound, Wrench, X,
  ArrowRight, BarChart3, MapPin, TrendingUp, Boxes, ListFilter, CalendarRange,
  DollarSign, Receipt, CreditCard, WalletCards, Banknote, Download,
  Mail, Phone, MapPinned, History, ContactRound, BriefcaseBusiness, UserPlus, Building, Activity
} from 'lucide-react';
import { configured, supabase } from '../services/supabase';
import { GlobalSearch } from './components/GlobalSearch';
import { SettingsHub } from './components/SettingsHub';
import {
  createCompany, createCustomer, createCustomerRequest, createFacility, createIssue,
  createPortalInvite, revokePortalInvite, getPortalInvitePreview, claimPortalInvite, createServicePlan, createWorkOrder, updateWorkOrder, archiveWorkOrder, updateWorkOrderArea, startWorkOrder, finishWorkOrder, verifyWorkOrder, returnWorkOrder, recordSupplyUsage, generateVisits, getMyProfile, loadWorkspace,
  saveMyProfile, seedMIP, toggleTask, updateVisit, uploadProof, createSupplyItem, upsertFacilityInventory, adjustFacilityInventory, deleteRecord, updateRecord, archiveRecord,
  createCustomerContact, updateCustomerContact, archiveCustomerContact, checkInfrastructure,
  createQuote, createInvoice, createPayment, createExpense, createPayrollEntry
} from '../services/api';

const empty = {
  customers:[], contacts:[], facilities:[], people:[], plans:[], visits:[],
  tasks:[], proof:[], issues:[], requests:[], supplies:[], inventory:[], invites:[], workOrders:[], workOrderAreas:[], supplyUsage:[], timeEntries:[], quotes:[], invoices:[], payments:[], expenses:[], payroll:[], inspections:[], inspectionAreas:[], inspectionItems:[], inspectionPhotos:[]
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
const customerNav = [['customer-home','Overview',Home],['customer-schedule','Schedule',CalendarDays],['customer-proof','Service Reports',FileText],['customer-requests','Requests',Wrench]];

function Shell({profile,portal,setPortal,page,setPage,data,children}) {
  const [mobileSheet,setMobileSheet]=useState(null);
  const [searchOpen,setSearchOpen]=useState(false);
  const flatAdmin=adminGroups.flatMap(g=>g.items);
  const nav = portal==='admin'?flatAdmin:portal==='employee'?employeeNav:customerNav;
  const bottom = portal==='admin'
    ? [['overview','Home',Home],['crm','CRM',UsersRound],['ops','Operations',ClipboardCheck],['finance','Finance',FileText],['more','More',Menu]]
    : nav.slice(0,4);

  useEffect(()=>{
    function shortcut(event){
      if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();setSearchOpen(true)}
      if(event.key==='Escape')setSearchOpen(false);
    }
    window.addEventListener('keydown',shortcut);
    return()=>window.removeEventListener('keydown',shortcut);
  },[]);

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
      <header className="top"><div><span>FacilityOS</span><strong>{nav.find(x=>x[0]===page)?.[1]||'Workspace'}</strong></div><button className="search" onClick={()=>setSearchOpen(true)}><Search size={18}/><span>Search anything...</span><kbd>⌘K</kbd></button><button className="icon"><Bell size={18}/></button><button className="avatarButton">{profile.full_name?.slice(0,1)||'U'}</button></header>
      <section className="canvas">{children}</section>
    </main>
    <nav className="mobileBottom">{bottom.map(([key,label,Icon])=><button key={key} className={page===key?'active':''} onClick={()=>bottomClick(key)}><Icon size={20}/><span>{label}</span></button>)}</nav>
    <GlobalSearch open={searchOpen} onClose={()=>setSearchOpen(false)} data={data} onNavigate={(targetPage)=>{setPortal('admin');setPage(targetPage)}}/>
    {mobileSheet && <div className="mobileSheetBackdrop" onClick={()=>setMobileSheet(null)}><section className="mobileSheet" onClick={e=>e.stopPropagation()}><div className="sheetHandle"/><h3>{mobileSheet}</h3>{(mobileSheet==='More' ? adminGroups.filter(g=>['Team','Reports','Settings'].includes(g.label)).flatMap(g=>g.items) : adminGroups.find(g=>g.label===mobileSheet)?.items||[]).map(([key,label,Icon])=><button key={key} onClick={()=>selectPage(key)}><Icon size={19}/><span>{label}</span><ChevronRight size={17}/></button>)}</section></div>}
  </div>;
}

function AdminOverview({data,setPage}) {
  const today=new Date().toISOString().slice(0,10);
  const todayOrders=data.workOrders.filter(w=>w.scheduled_date===today&&w.status!=='archived');
  const pending=data.workOrders.filter(w=>w.status==='awaiting_verification');
  const active=data.workOrders.filter(w=>['in_progress','returned'].includes(w.status));
  const openIssues=data.issues.filter(i=>i.status!=='closed');
  const lowStock=data.inventory.filter(x=>Number(x.quantity_on_hand)<=Number(x.reorder_level));
  const monthlyRevenue=data.customers.reduce((sum,c)=>sum+Number(c.monthly_value||0),0);
  const customer=id=>data.customers.find(c=>c.id===id);
  const facility=id=>data.facilities.find(f=>f.id===id);
  const employee=id=>data.people.find(p=>p.id===id);

  return <div className="page opsHome">
    <section className="commandHero">
      <div>
        <p className="eyebrow">Aurora command center</p>
        <h1>Good morning, Ignacio.</h1>
        <p>Everything that needs attention across today’s cleaning operation.</p>
        <div className="heroActions">
          <Button onClick={()=>setPage('work-orders')}><Plus size={16}/> Create work order</Button>
          <Button variant="light" onClick={()=>setPage('calendar')}><CalendarRange size={16}/> Open calendar</Button>
        </div>
      </div>
      <div className="heroPulse">
        <span>Live operations</span>
        <strong>{active.length}</strong>
        <small>missions moving now</small>
      </div>
    </section>

    <div className="metricGrid">
      <button className="metricCard" onClick={()=>setPage('work-orders')}>
        <div className="metricIcon blue"><ClipboardCheck size={21}/></div>
        <span>Jobs today</span><strong>{todayOrders.length}</strong><small>{todayOrders.filter(w=>w.status==='scheduled').length} still scheduled</small>
      </button>
      <button className="metricCard" onClick={()=>setPage('work-orders')}>
        <div className="metricIcon amber"><ShieldCheck size={21}/></div>
        <span>Waiting approval</span><strong>{pending.length}</strong><small>Manager verification queue</small>
      </button>
      <button className="metricCard" onClick={()=>setPage('supplies')}>
        <div className="metricIcon red"><PackageOpen size={21}/></div>
        <span>Low inventory</span><strong>{lowStock.length}</strong><small>Facility items below reorder</small>
      </button>
      <button className="metricCard" onClick={()=>setPage('issues')}>
        <div className="metricIcon violet"><AlertTriangle size={21}/></div>
        <span>Open issues</span><strong>{openIssues.length}</strong><small>Customer and employee reports</small>
      </button>
      <button className="metricCard" onClick={()=>setPage('customers')}>
        <div className="metricIcon green"><TrendingUp size={21}/></div>
        <span>Monthly recurring value</span><strong>${monthlyRevenue.toLocaleString()}</strong><small>{data.customers.length} active customers</small>
      </button>
    </div>

    <div className="dashboardGrid">
      <section className="panel liveBoard">
        <div className="panelTitle">
          <div><p className="eyebrow">Today</p><h2>Live mission board</h2></div>
          <button className="link" onClick={()=>setPage('work-orders')}>All work orders <ArrowRight size={15}/></button>
        </div>
        <div className="liveRows">
          {todayOrders.map(order=><button className="liveMission" key={order.id} onClick={()=>setPage('work-orders')}>
            <div className="timePill">{order.scheduled_time||'Any'}</div>
            <div className="liveMissionMain">
              <strong>{facility(order.facility_id)?.name||order.title}</strong>
              <span>{customer(order.customer_id)?.name||'Customer'} · {employee(order.assigned_to_profile_id)?.full_name||'Unassigned'}</span>
            </div>
            <div className={`status ${order.status}`}>{order.status}</div>
          </button>)}
          {!todayOrders.length&&<Empty title="No work orders today" text="Create a work order or generate visits from a recurring plan."/>}
        </div>
      </section>

      <section className="attentionPanel">
        <div className="panelTitle"><div><p className="eyebrow">Attention</p><h2>Priority queue</h2></div></div>
        <button onClick={()=>setPage('work-orders')}><ShieldCheck size={18}/><div><strong>{pending.length} approvals</strong><span>Completed missions waiting for you</span></div><ChevronRight size={17}/></button>
        <button onClick={()=>setPage('supplies')}><PackageOpen size={18}/><div><strong>{lowStock.length} low-stock items</strong><span>Restock before the next service</span></div><ChevronRight size={17}/></button>
        <button onClick={()=>setPage('issues')}><AlertTriangle size={18}/><div><strong>{openIssues.length} open issues</strong><span>Review facility findings</span></div><ChevronRight size={17}/></button>
        <button onClick={()=>setPage('customer-requests')}><Wrench size={18}/><div><strong>{data.requests.filter(r=>r.status==='new').length} new requests</strong><span>Customer service needs</span></div><ChevronRight size={17}/></button>
      </section>
    </div>

    <section className="panel facilitySnapshot">
      <div className="panelTitle"><div><p className="eyebrow">Facilities</p><h2>Operational snapshot</h2></div><button className="link" onClick={()=>setPage('facilities')}>View facilities</button></div>
      <div className="facilitySnapshotGrid">
        {data.facilities.slice(0,4).map(f=>{
          const orders=data.workOrders.filter(w=>w.facility_id===f.id&&w.status!=='archived');
          const inventory=data.inventory.filter(i=>i.facility_id===f.id);
          return <button key={f.id} className="facilitySnapshotCard" onClick={()=>setPage('facilities')}>
            <div className="facilityAvatar"><Building2 size={20}/></div>
            <div><strong>{f.name}</strong><span>{customer(f.customer_id)?.name}</span></div>
            <div className="facilityQuick"><b>{orders.length}</b><span>jobs</span><b>{inventory.length}</b><span>supplies</span></div>
          </button>
        })}
      </div>
    </section>
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

function CustomersPage({data,companyId,reload,setPage}) {
  const blank={name:'',customer_type:'commercial',email:'',phone:'',address:'',monthly_value:''};
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState(null);
  const [selected,setSelected]=useState(null);
  const [form,setForm]=useState(blank);
  const [message,setMessage]=useState('');
  const [query,setQuery]=useState('');

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
    const {error}=await archiveRecord('customers',customer.id);if(error)return setMessage(error.message);setSelected(null);await reload();
  }

  const visible=data.customers.filter(c=>`${c.name} ${c.customer_type||''} ${c.email||''}`.toLowerCase().includes(query.toLowerCase()));

  if(selected){
    const customer=data.customers.find(c=>c.id===selected.id)||selected;
    const facilities=data.facilities.filter(f=>f.customer_id===customer.id);
    const contacts=data.contacts.filter(c=>c.customer_id===customer.id);
    const quotes=data.quotes.filter(q=>q.customer_id===customer.id);
    const invoices=data.invoices.filter(i=>i.customer_id===customer.id);
    const payments=data.payments.filter(p=>p.customer_id===customer.id);
    const workOrders=data.workOrders.filter(w=>w.customer_id===customer.id&&w.status!=='archived');
    const issues=data.issues.filter(i=>i.customer_id===customer.id);
    const requests=data.requests.filter(r=>r.customer_id===customer.id);
    const totalInvoiced=invoices.reduce((s,i)=>s+Number(i.amount||0),0);
    const totalPaid=payments.reduce((s,p)=>s+Number(p.amount||0),0);
    const activity=[
      ...workOrders.map(x=>({type:'work',date:x.created_at||x.scheduled_date,title:x.title,detail:`Work order · ${x.status}`})),
      ...issues.map(x=>({type:'issue',date:x.created_at,title:x.title,detail:`Issue · ${x.status}`})),
      ...quotes.map(x=>({type:'quote',date:x.created_at,title:x.title||x.quote_number,detail:`Quote · ${x.status}`})),
      ...invoices.map(x=>({type:'invoice',date:x.created_at,title:x.invoice_number||'Invoice',detail:`Invoice · ${x.status}`})),
      ...requests.map(x=>({type:'request',date:x.created_at,title:x.title,detail:`Request · ${x.status}`}))
    ].sort((a,b)=>new Date(b.date||0)-new Date(a.date||0)).slice(0,12);

    return <div className="page customerWorkspace">
      <button className="back" onClick={()=>setSelected(null)}><ArrowLeft size={18}/> Customers</button>
      <section className="customerHero">
        <div className="customerHeroAvatar">{customer.name?.slice(0,1)||'C'}</div>
        <div className="grow">
          <p className="eyebrow">Customer workspace</p>
          <h1>{customer.name}</h1>
          <p>{customer.customer_type||'commercial'} · {customer.address||'No address'}</p>
          <div className="customerContactLine">
            {customer.email&&<span><Mail size={14}/>{customer.email}</span>}
            {customer.phone&&<span><Phone size={14}/>{customer.phone}</span>}
          </div>
        </div>
        <div className="heroActions">
          <Button variant="secondary" onClick={()=>editCustomer(customer)}>Edit</Button>
          <Button onClick={()=>setPage('quotes')}><Plus size={16}/> New quote</Button>
        </div>
      </section>

      <div className="stats">
        <Stat icon={Building2} label="Facilities" value={facilities.length} note="Managed locations"/>
        <Stat icon={ContactRound} label="Contacts" value={contacts.length} note="Customer stakeholders"/>
        <Stat icon={ClipboardCheck} label="Work orders" value={workOrders.length} note={`${workOrders.filter(w=>w.status==='verified').length} verified`}/>
        <Stat icon={Receipt} label="Outstanding" value={`$${Math.max(0,totalInvoiced-totalPaid).toLocaleString()}`} note={`$${totalPaid.toLocaleString()} received`}/>
      </div>

      <div className="crmWorkspaceGrid">
        <section className="panel">
          <div className="panelTitle"><div><p className="eyebrow">Locations</p><h2>Facilities</h2></div><button className="link" onClick={()=>setPage('facilities')}>Manage</button></div>
          {facilities.map(f=><div className="crmEntityRow" key={f.id}>
            <div className="crmEntityIcon"><Building2 size={18}/></div>
            <div className="grow"><strong>{f.name}</strong><span>{f.facility_type} · {f.address||'No address'}</span></div>
            <div className="status active">{f.status}</div>
          </div>)}
          {!facilities.length&&<Empty title="No facilities" text="Add the first customer facility."/>}
        </section>

        <section className="panel">
          <div className="panelTitle"><div><p className="eyebrow">People</p><h2>Contacts</h2></div><button className="link" onClick={()=>setPage('contacts')}>Manage</button></div>
          {contacts.map(c=><div className="crmEntityRow" key={c.id}>
            <div className="avatar">{c.full_name?.slice(0,1)||'C'}</div>
            <div className="grow"><strong>{c.full_name}</strong><span>{c.title||'Contact'} · {c.email||c.phone||'No contact method'}</span></div>
          </div>)}
          {!contacts.length&&<Empty title="No contacts" text="Add report, quote, and invoice recipients."/>}
        </section>

        <section className="panel">
          <div className="panelTitle"><div><p className="eyebrow">Commercial</p><h2>Quotes & invoices</h2></div></div>
          {quotes.slice(0,4).map(q=><div className="financeRow" key={q.id}><div className="financeDocIcon"><FileText size={18}/></div><div className="grow"><strong>{q.quote_number||q.title}</strong><span>{q.status}</span></div><b>${Number(q.amount||0).toLocaleString()}</b></div>)}
          {invoices.slice(0,4).map(i=><div className="financeRow" key={i.id}><div className="financeDocIcon"><Receipt size={18}/></div><div className="grow"><strong>{i.invoice_number||'Invoice'}</strong><span>{i.status} · due {i.due_date||'not set'}</span></div><b>${Number(i.amount||0).toLocaleString()}</b></div>)}
          {!quotes.length&&!invoices.length&&<Empty title="No commercial records" text="Quotes and invoices will appear here."/>}
        </section>

        <section className="panel">
          <div className="panelTitle"><div><p className="eyebrow">Service health</p><h2>Issues & requests</h2></div></div>
          {issues.filter(i=>i.status!=='closed').slice(0,5).map(i=><div className="crmEntityRow" key={i.id}><div className={`priority ${i.priority}`}/><div className="grow"><strong>{i.title}</strong><span>{i.status}</span></div></div>)}
          {requests.slice(0,5).map(r=><div className="crmEntityRow" key={r.id}><div className="crmEntityIcon"><Wrench size={18}/></div><div className="grow"><strong>{r.title}</strong><span>{r.status}</span></div></div>)}
          {!issues.length&&!requests.length&&<Empty title="No open needs" text="Issues and customer requests appear here."/>}
        </section>
      </div>

      <section className="panel customerTimeline">
        <div className="panelTitle"><div><p className="eyebrow">History</p><h2>Customer timeline</h2></div><History size={18}/></div>
        <div className="timelineList">
          {activity.map((item,index)=><div className="timelineItem" key={`${item.type}-${index}`}>
            <div className={`timelineDot ${item.type}`}/>
            <div className="timelineContent"><strong>{item.title}</strong><span>{item.detail}</span></div>
            <time>{item.date?new Date(item.date).toLocaleDateString():'—'}</time>
          </div>)}
          {!activity.length&&<Empty title="No customer activity" text="Work orders, issues, quotes, and invoices will build this timeline."/>}
        </div>
      </section>

      <div className="dangerZone"><button onClick={()=>archive(customer)}>Archive customer</button></div>
      <Modal open={open} title={editing?'Edit customer':'New customer'} onClose={()=>setOpen(false)}><div className="form">
        <label>Name<input value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/></label>
        <div className="form2"><label>Type<select value={form.customer_type||'commercial'} onChange={e=>setForm({...form,customer_type:e.target.value})}><option>commercial</option><option>logistics</option><option>medical</option><option>retail</option></select></label><label>Monthly value<input type="number" value={form.monthly_value||''} onChange={e=>setForm({...form,monthly_value:e.target.value})}/></label></div>
        <div className="form2"><label>Email<input value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Phone<input value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})}/></label></div>
        <label>Address<input value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})}/></label>
        {message&&<div className="notice">{message}</div>}<Button onClick={save}>Save changes</Button>
      </div></Modal>
    </div>;
  }

  return <div className="page">
    <div className="pageHeader"><div><p className="eyebrow">CRM 2.0</p><h1>Customers</h1><p>Open a customer to see facilities, contacts, service history, quotes, invoices, and requests.</p></div><Button onClick={newCustomer}><Plus size={16}/> New customer</Button></div>
    {message&&<div className="notice">{message}</div>}
    <section className="crmToolbar"><div className="searchInput"><Search size={17}/><input placeholder="Search customers..." value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="crmTotals"><span>{visible.length} customers</span><strong>${visible.reduce((s,c)=>s+Number(c.monthly_value||0),0).toLocaleString()}/mo</strong></div></section>
    <div className="customerCardGrid">
      {visible.map(c=>{const facilities=data.facilities.filter(f=>f.customer_id===c.id);const contacts=data.contacts.filter(x=>x.customer_id===c.id);const openIssues=data.issues.filter(i=>i.customer_id===c.id&&i.status!=='closed');const balance=data.invoices.filter(i=>i.customer_id===c.id).reduce((s,i)=>s+Number(i.amount||0),0)-data.payments.filter(p=>p.customer_id===c.id).reduce((s,p)=>s+Number(p.amount||0),0);return <button className="customerCardV2" key={c.id} onClick={()=>setSelected(c)}>
        <div className="customerCardTop"><div className="customerInitial">{c.name?.slice(0,1)||'C'}</div><div className="status active">active</div></div>
        <h2>{c.name}</h2><p>{c.customer_type||'commercial'} · {c.email||c.phone||'No primary contact'}</p>
        <div className="customerCardMetrics"><span><b>{facilities.length}</b> facilities</span><span><b>{contacts.length}</b> contacts</span><span className={openIssues.length?'warn':''}><b>{openIssues.length}</b> issues</span></div>
        <div className="customerCardMoney"><div><span>Monthly value</span><strong>${Number(c.monthly_value||0).toLocaleString()}</strong></div><div><span>Balance</span><strong>${Math.max(0,balance).toLocaleString()}</strong></div></div>
        <div className="facilityCardFooter"><span>{c.address||'No address'}</span><ChevronRight size={17}/></div>
      </button>})}
      {!visible.length&&<Empty title="No matching customers" text="Create a customer or change your search."/>}
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
  const [open,setOpen]=useState(false);const [editing,setEditing]=useState(null);const [selected,setSelected]=useState(null);const [form,setForm]=useState(blank);const [message,setMessage]=useState('');
  const customer=id=>data.customers.find(c=>c.id===id);
  function newFacility(){setEditing(null);setForm(blank);setMessage('');setOpen(true)}
  function editFacility(f){setEditing(f);setForm({...blank,...f});setMessage('');setOpen(true)}
  async function save(){const payload={...form,restroom_count:Number(form.restroom_count||0),estimated_minutes:Number(form.estimated_minutes||0)};const result=editing?await updateRecord('facilities',editing.id,payload):await createFacility(companyId,payload);if(result.error)return setMessage(result.error.message);setOpen(false);setEditing(null);await reload()}
  async function archive(f){if(!confirm(`Archive ${f.name}?`))return;const{error}=await archiveRecord('facilities',f.id);if(error)return setMessage(error.message);setSelected(null);await reload()}

  if(selected){
    const current=data.facilities.find(f=>f.id===selected.id)||selected;
    const orders=data.workOrders.filter(w=>w.facility_id===current.id&&w.status!=='archived');
    const issues=data.issues.filter(i=>i.facility_id===current.id);
    const inventory=data.inventory.filter(i=>i.facility_id===current.id);
    const plans=data.plans.filter(p=>p.facility_id===current.id);
    return <div className="page">
      <button className="back" onClick={()=>setSelected(null)}><ArrowLeft size={18}/> Facilities</button>
      <section className="facilityHero">
        <div className="facilityHeroIcon"><Building2 size={28}/></div>
        <div className="grow"><p className="eyebrow">Facility workspace</p><h1>{current.name}</h1><p>{customer(current.customer_id)?.name} · {current.address||'No address'}</p></div>
        <Button variant="secondary" onClick={()=>editFacility(current)}>Edit facility</Button>
      </section>
      <div className="stats">
        <Stat icon={Clock} label="Estimated service" value={`${current.estimated_minutes||0} min`} note="Per visit"/>
        <Stat icon={ClipboardCheck} label="Work orders" value={orders.length} note={`${orders.filter(w=>w.status==='verified').length} verified`}/>
        <Stat icon={PackageOpen} label="Supply items" value={inventory.length} note={`${inventory.filter(i=>Number(i.quantity_on_hand)<=Number(i.reorder_level)).length} low`}/>
        <Stat icon={AlertTriangle} label="Issues" value={issues.filter(i=>i.status!=='closed').length} note="Open findings"/>
      </div>
      <div className="facilityTabs">
        <section className="panel">
          <div className="panelTitle"><h2>Facility instructions</h2><MapPin size={18}/></div>
          <div className="detailList"><div><span>Facility type</span><strong>{current.facility_type}</strong></div><div><span>Floor type</span><strong>{current.floor_type||'Not set'}</strong></div><div><span>Restrooms</span><strong>{current.restroom_count||0}</strong></div></div>
          <div className="softBox"><strong>Access & cleaning notes</strong><span>{current.access_notes||'No notes yet.'}</span></div>
        </section>
        <section className="panel">
          <div className="panelTitle"><h2>Service plans</h2><CalendarDays size={18}/></div>
          {plans.map(p=><div className="simpleRow" key={p.id}><CalendarRange size={18}/><div><strong>{p.name}</strong><span>{p.frequency} · {p.default_time}</span></div></div>)}
          {!plans.length&&<Empty title="No service plans" text="Create one from the calendar."/>}
        </section>
        <section className="panel">
          <div className="panelTitle"><h2>Supply closet</h2><Boxes size={18}/></div>
          {inventory.map(row=>{const supply=data.supplies.find(s=>s.id===row.supply_item_id);return <div className="inventoryMini" key={row.id}><div><strong>{supply?.name||'Supply'}</strong><span>{row.storage_location||'No location'}</span></div><div className={Number(row.quantity_on_hand)<=Number(row.reorder_level)?'stockBadge low':'stockBadge'}>{row.quantity_on_hand} {supply?.unit||''}</div></div>})}
          {!inventory.length&&<Empty title="No facility inventory" text="Add stock from the Supplies module."/>}
        </section>
        <section className="panel">
          <div className="panelTitle"><h2>Recent activity</h2><BarChart3 size={18}/></div>
          {orders.slice(0,6).map(w=><div className="simpleRow" key={w.id}><ClipboardCheck size={18}/><div><strong>{w.title}</strong><span>{w.scheduled_date} · {w.status}</span></div></div>)}
          {issues.slice(0,4).map(i=><div className="simpleRow" key={i.id}><AlertTriangle size={18}/><div><strong>{i.title}</strong><span>{i.status}</span></div></div>)}
        </section>
      </div>
    </div>
  }

  return <div className="page">
    <div className="pageHeader"><div><p className="eyebrow">Facility digital twin</p><h1>Facilities</h1><p>Open a facility to see instructions, service plans, inventory, issues, and activity.</p></div><Button onClick={newFacility}><Plus size={16}/> New facility</Button></div>
    {message&&<div className="notice">{message}</div>}
    <div className="facilityCardGrid">
      {data.facilities.map(f=>{const orders=data.workOrders.filter(w=>w.facility_id===f.id&&w.status!=='archived');const inventory=data.inventory.filter(i=>i.facility_id===f.id);const low=inventory.filter(i=>Number(i.quantity_on_hand)<=Number(i.reorder_level)).length;return <button className="facilityCardV2" key={f.id} onClick={()=>setSelected(f)}>
        <div className="objectHead"><div className="facilityAvatar"><Building2 size={22}/></div><div className="status active">{f.status}</div></div>
        <h2>{f.name}</h2><p>{customer(f.customer_id)?.name} · {f.facility_type}</p>
        <div className="facilityCardStats"><span><b>{orders.length}</b> jobs</span><span><b>{inventory.length}</b> supplies</span><span className={low?'warn':''}><b>{low}</b> low</span></div>
        <div className="facilityCardFooter"><span>{f.address||'No address'}</span><ChevronRight size={17}/></div>
      </button>})}
      {!data.facilities.length&&<Empty title="No facilities" text="Create your first facility."/>}
    </div>
    <Modal open={open} title={editing?'Edit facility':'New facility'} onClose={()=>setOpen(false)}><div className="form"><label>Customer<select value={form.customer_id||''} onChange={e=>setForm({...form,customer_id:e.target.value})}><option value="">Select...</option>{data.customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Name<input value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/></label><div className="form2"><label>Type<select value={form.facility_type||'office'} onChange={e=>setForm({...form,facility_type:e.target.value})}><option>office</option><option>warehouse</option><option>medical</option><option>retail</option></select></label><label>Restrooms<input type="number" value={form.restroom_count||0} onChange={e=>setForm({...form,restroom_count:e.target.value})}/></label></div><div className="form2"><label>Floor type<input value={form.floor_type||''} onChange={e=>setForm({...form,floor_type:e.target.value})}/></label><label>Estimated minutes<input type="number" value={form.estimated_minutes||0} onChange={e=>setForm({...form,estimated_minutes:e.target.value})}/></label></div><label>Address<input value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})}/></label><label>Access and cleaning notes<textarea value={form.access_notes||''} onChange={e=>setForm({...form,access_notes:e.target.value})}/></label>{message&&<div className="notice">{message}</div>}<Button onClick={save}>{editing?'Save changes':'Create facility'}</Button></div></Modal>
  </div>;
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
  const [statusFilter,setStatusFilter]=useState('all');
  const [query,setQuery]=useState('');
  const [verification,setVerification]=useState({summary:'Service completed according to the facility plan.',quality_score:100,return_note:''});
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

  async function approve(order){
    const {error}=await verifyWorkOrder(order.id,profile.id,verification.summary,verification.quality_score);
    if(error)return setMessage(error.message);
    setMessage('Work order verified. The customer report is now visible.');
    await reload();
    setSelected({...order,status:'verified',customer_summary:verification.summary,quality_score:Number(verification.quality_score)});
  }

  async function sendBack(order){
    if(!verification.return_note.trim())return setMessage('Add a correction note before returning the work order.');
    const {error}=await returnWorkOrder(order.id,verification.return_note);
    if(error)return setMessage(error.message);
    setMessage('Work order returned to the employee with your note.');
    await reload();
    setSelected({...order,status:'returned',manager_note:verification.return_note});
  }

  if(selected){
    const current=data.workOrders.find(order=>order.id===selected.id)||selected;
    const areas=data.workOrderAreas.filter(a=>a.work_order_id===current.id);
    const usage=data.supplyUsage.filter(item=>item.work_order_id===current.id);
    const entries=data.timeEntries.filter(item=>item.work_order_id===current.id);
    const completed=areas.filter(a=>a.status==='completed').length;
    const progress=areas.length?Math.round(completed/areas.length*100):0;
    const started=entries.map(e=>e.started_at).filter(Boolean).sort()[0];
    const ended=entries.map(e=>e.ended_at).filter(Boolean).sort().at(-1);
    const actualMinutes=started&&ended?Math.max(1,Math.round((new Date(ended)-new Date(started))/60000)):null;
    return <div className="page">
      <button className="back" onClick={()=>setSelected(null)}><ArrowLeft size={18}/> Work Orders</button>
      <div className="missionHero"><div><p className="eyebrow">Work Order</p><h1>{current.title}</h1><p>{customer(current.customer_id)?.name} · {facility(current.facility_id)?.name}</p></div><div className={`status ${current.status}`}>{current.status}</div></div>
      <div className="stats">
        <Stat icon={CalendarDays} label="Scheduled" value={current.scheduled_date} note={current.scheduled_time||'No time'}/>
        <Stat icon={CircleUserRound} label="Assigned" value={employee(current.assigned_to_profile_id)?.full_name||'Unassigned'} note="Employee"/>
        <Stat icon={Clock} label="Actual time" value={actualMinutes?`${actualMinutes} min`:'—'} note={`${current.estimated_minutes||0} min estimated`}/>
        <Stat icon={CheckCircle2} label="Progress" value={`${progress}%`} note={`${completed}/${areas.length} areas`}/>
      </div>
      <div className="grid2">
        <section className="panel"><div className="panelTitle"><h2>Areas</h2><span>{completed}/{areas.length}</span></div>{areas.map(area=><div className="areaAdminRow" key={area.id}><div><strong>{area.name}</strong><span>{area.completed_at?new Date(area.completed_at).toLocaleString():area.status}</span></div><div className={`status ${area.status}`}>{area.status}</div></div>)}{!areas.length&&<Empty title="No areas" text="Add areas when creating the work order."/>}</section>
        <section className="panel"><h2>Mission evidence</h2><p>{current.instructions||facility(current.facility_id)?.access_notes||'No special instructions.'}</p><div className="reportFacts"><span><b>{usage.length}</b> supply entries</span><span><b>{entries.length}</b> time entries</span><span><b>{current.quality_score||'—'}</b> quality score</span></div>{current.manager_note&&<div className="returnNote"><strong>Manager note</strong><p>{current.manager_note}</p></div>}</section>
      </div>
      {current.status==='awaiting_verification'&&<section className="panel verificationPanel"><div className="panelTitle"><div><p className="eyebrow">Manager verification</p><h2>Approve customer report</h2></div><ShieldCheck size={24}/></div><label>Customer-facing summary<textarea value={verification.summary} onChange={e=>setVerification({...verification,summary:e.target.value})}/></label><div className="form2"><label>Quality score<input type="number" min="0" max="100" value={verification.quality_score} onChange={e=>setVerification({...verification,quality_score:e.target.value})}/></label><label>Correction note<textarea value={verification.return_note} onChange={e=>setVerification({...verification,return_note:e.target.value})}/></label></div><div className="buttonRow"><Button variant="secondary" onClick={()=>sendBack(current)}>Return for correction</Button><Button onClick={()=>approve(current)}><ShieldCheck size={17}/> Verify and release report</Button></div></section>}
      {current.status==='verified'&&<section className="serviceReport"><div className="reportHeader"><div><p className="eyebrow">Verified service report</p><h2>{facility(current.facility_id)?.name}</h2><p>{current.customer_summary||'Service completed and verified.'}</p></div><div className="qualityRing">{current.quality_score||100}<small>/100</small></div></div><div className="reportFacts"><span><b>{current.scheduled_date}</b> service date</span><span><b>{actualMinutes||current.estimated_minutes||0} min</b> time</span><span><b>{completed}</b> areas completed</span><span><b>{usage.length}</b> supply entries</span></div></section>}
      <Button variant="ghost" onClick={()=>archive(current)}>Archive</Button>
      {message&&<div className="notice">{message}</div>}
    </div>;
  }

  const visibleOrders=data.workOrders.filter(order=>{
    const matchStatus=statusFilter==='all'||order.status===statusFilter;
    const label=`${order.title} ${customer(order.customer_id)?.name||''} ${facility(order.facility_id)?.name||''}`.toLowerCase();
    return matchStatus&&label.includes(query.toLowerCase());
  });
  return <div className="page">
    <div className="pageHeader"><div><p className="eyebrow">Operations Engine</p><h1>Work Orders</h1><p>Schedule, assign, execute, and verify each cleaning mission.</p></div><Button onClick={()=>{setForm(blank);setMessage('');setOpen(true)}}><Plus size={16}/> New work order</Button></div>
    {message&&<div className="notice">{message}</div>}
    <section className="workOrderToolbar"><div className="searchInput"><Search size={17}/><input placeholder="Search work orders..." value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="segmented compact">{['all','scheduled','in_progress','awaiting_verification','verified'].map(s=><button key={s} className={statusFilter===s?'active':''} onClick={()=>setStatusFilter(s)}>{s.replaceAll('_',' ')}</button>)}</div></section>
    <div className="workOrderGrid">{visibleOrders.map(order=><button className="workOrderCard" key={order.id} onClick={()=>setSelected(order)}><div className="objectHead"><div className="objectIcon"><ClipboardCheck size={21}/></div><div className={`status ${order.status}`}>{order.status}</div></div><p className="eyebrow">{order.scheduled_date} · {order.scheduled_time||'Any time'}</p><h2>{order.title}</h2><p>{customer(order.customer_id)?.name} · {facility(order.facility_id)?.name}</p><div className="miniStats"><span><b>{employee(order.assigned_to_profile_id)?.full_name||'Unassigned'}</b></span><span><b>{order.estimated_minutes||0}</b> min</span></div></button>)}{!visibleOrders.length&&<Empty title="No matching work orders" text="Change the search or status filter."/>}</div>
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
      {['scheduled','returned'].includes(current.status)&&<Button onClick={()=>start(current)}>{current.status==='returned'?'Resume corrections':'Start mission'}</Button>}{current.manager_note&&<div className="returnNote"><strong>Manager correction</strong><p>{current.manager_note}</p></div>}
      <section className="panel"><div className="panelTitle"><h2>Area workflow</h2><span>{areas.filter(a=>a.status==='completed').length}/{areas.length}</span></div>{areas.map(area=><label className="task" key={area.id}><input type="checkbox" checked={area.status==='completed'} onChange={()=>toggleArea(area)}/><div><strong>{area.name}</strong><span>{area.status==='completed'?'Completed':'Tap when complete'}</span></div></label>)}</section>
      <section className="panel"><h2>Supplies used</h2><div className="form2"><label>Supply<select value={supplyId} onChange={e=>setSupplyId(e.target.value)}><option value="">Select...</option>{inventory.map(item=>{const supply=data.supplies.find(s=>s.id===item.supply_item_id);return <option key={item.id} value={item.supply_item_id}>{supply?.name||'Supply'} — {item.quantity||0}</option>})}</select></label><label>Quantity<input type="number" min="1" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label></div><Button variant="secondary" onClick={useSupply}>Record usage</Button></section>
      <Button onClick={finish}><CheckCircle2 size={17}/> Submit mission</Button>{message&&<div className="notice">{message}</div>}
    </div>;
  }

  return <div className="page"><div className="pageHeader"><div><p className="eyebrow">Employee Portal</p><h1>Today's missions</h1><p>Complete each assigned work order area by area.</p></div></div><div className="missionCards">{mine.map(order=>{const facility=data.facilities.find(f=>f.id===order.facility_id);return <button className="missionCard" key={order.id} onClick={()=>setSelected(order)}><div className="missionTime">{order.scheduled_date} · {order.scheduled_time||'Any time'}</div><h2>{order.title}</h2><p>{facility?.name}</p><div className={`status ${order.status}`}>{order.status}</div></button>})}{!mine.length&&<Empty title="No assigned work orders" text="Assigned missions will appear here."/>}</div></div>;
}


function ScoreRing({value,label='Score'}){const safe=Math.max(0,Math.min(100,Number(value||0)));return <div className="scoreRing" style={{'--score':`${safe*3.6}deg`}}><div><strong>{Math.round(safe)}</strong><span>{label}</span></div></div>}
function InspectionsPage({data,companyId,profile,reload}){const blank={customer_id:'',facility_id:'',work_order_id:'',title:'Quality Inspection',area_names:'Reception, Restrooms, Kitchen, Offices'};const[open,setOpen]=useState(false);const[selected,setSelected]=useState(null);const[form,setForm]=useState(blank);const[message,setMessage]=useState('');const[summary,setSummary]=useState('Service quality meets the facility standard.');const facilities=data.facilities.filter(f=>!form.customer_id||f.customer_id===form.customer_id);const workOrders=data.workOrders.filter(w=>!form.facility_id||w.facility_id===form.facility_id);async function save(){if(!form.facility_id)return setMessage('Select a facility.');const{data:inspection,error}=await createInspection(companyId,form,profile.id);if(error)return setMessage(error.message);setOpen(false);setForm(blank);await reload();setSelected(inspection)}async function setAreaScore(area,score){const status=Number(score)>=80?'passed':Number(score)>=60?'needs_attention':'failed';const{error}=await updateInspectionArea(area.id,{score:Number(score),status});if(error)return setMessage(error.message);await reload()}async function toggleItem(item){const passed=item.status!=='passed';const{error}=await updateInspectionItem(item.id,{status:passed?'passed':'pending',score:passed?100:0});if(error)return setMessage(error.message);await reload()}async function addPhoto(e,inspection,area,type){const file=e.target.files?.[0];if(!file)return;const{error}=await uploadInspectionPhoto(companyId,inspection.id,area.id,profile.id,file,type);if(error)return setMessage(error.message);setMessage(`${type} photo uploaded.`);await reload()}async function finishInspection(inspection,areas){if(!areas.length)return setMessage('Add inspection areas first.');const overall=Math.round(areas.reduce((s,a)=>s+Number(a.score||0),0)/areas.length);const{error}=await completeInspection(inspection.id,overall,summary);if(error)return setMessage(error.message);setMessage('Inspection completed.');await reload()}
if(selected){const current=data.inspections.find(i=>i.id===selected.id)||selected;const areas=data.inspectionAreas.filter(a=>a.inspection_id===current.id);const photos=data.inspectionPhotos.filter(p=>p.inspection_id===current.id);const facility=data.facilities.find(f=>f.id===current.facility_id);const customer=data.customers.find(c=>c.id===current.customer_id);const computed=areas.length?Math.round(areas.reduce((s,a)=>s+Number(a.score||0),0)/areas.length):0;return <div className="page inspectionWorkspace"><button className="back" onClick={()=>setSelected(null)}><ArrowLeft size={18}/> Inspections</button><section className="inspectionHero"><div className="grow"><p className="eyebrow">Inspection intelligence</p><h1>{current.title}</h1><p>{customer?.name||'Customer'} · {facility?.name||'Facility'}</p></div><ScoreRing value={current.status==='completed'?current.overall_score:computed} label="Quality"/></section><div className="stats"><Stat icon={Building2} label="Areas" value={areas.length} note={`${areas.filter(a=>a.status==='passed').length} passed`}/><Stat icon={ClipboardList} label="Items" value={data.inspectionItems.filter(i=>areas.some(a=>a.id===i.inspection_area_id)).length} note="Inspection checks"/><Stat icon={Images} label="Photos" value={photos.length} note="Before and after"/><Stat icon={AlertTriangle} label="Needs attention" value={areas.filter(a=>['failed','needs_attention'].includes(a.status)).length} note="Review required"/></div><div className="inspectionAreaList">{areas.map(area=>{const items=data.inspectionItems.filter(i=>i.inspection_area_id===area.id);const areaPhotos=photos.filter(p=>p.inspection_area_id===area.id);return <section className={`inspectionAreaCard ${area.status}`} key={area.id}><div className="inspectionAreaHead"><div><div className="impactBadge">{area.visual_impact} impact</div><h2>{area.area_name}</h2><span>{items.filter(i=>i.status==='passed').length}/{items.length} checks passed</span></div><div className="areaScoreControl"><strong>{Math.round(Number(area.score||0))}</strong><input type="range" min="0" max="100" value={Number(area.score||0)} onChange={e=>setAreaScore(area,e.target.value)}/></div></div><div className="inspectionChecklist">{items.map(item=><button className={item.status==='passed'?'inspectionCheck passed':'inspectionCheck'} key={item.id} onClick={()=>toggleItem(item)}>{item.status==='passed'?<CheckCircle2 size={19}/>:<div className="emptyCheck"/>}<div><strong>{item.title}</strong>{item.requires_photo&&<span>Photo recommended</span>}</div></button>)}</div><div className="inspectionPhotoActions"><label className="miniUpload"><Camera size={18}/><span>Before</span><input type="file" accept="image/*" capture="environment" onChange={e=>addPhoto(e,current,area,'before')}/></label><label className="miniUpload"><Camera size={18}/><span>After</span><input type="file" accept="image/*" capture="environment" onChange={e=>addPhoto(e,current,area,'after')}/></label><div className="photoCount">{areaPhotos.length} photos</div></div>{!!areaPhotos.length&&<div className="inspectionPhotoGrid">{areaPhotos.map(photo=><figure key={photo.id}><img src={photo.file_url}/><figcaption>{photo.photo_type}</figcaption></figure>)}</div>}</section>})}</div><section className="panel"><div className="panelTitle"><div><p className="eyebrow">Customer summary</p><h2>Inspection narrative</h2></div></div><textarea value={summary} onChange={e=>setSummary(e.target.value)}/><div className="buttonRow"><Button variant="secondary" onClick={()=>setSelected(null)}>Save and return</Button><Button onClick={()=>finishInspection(current,areas)}><ShieldCheck size={17}/> Complete inspection</Button></div></section>{message&&<div className="notice">{message}</div>}</div>}
return <div className="page"><div className="pageHeader"><div><p className="eyebrow">Inspection intelligence</p><h1>Inspections</h1><p>Score each facility area, document proof, and create a customer-ready quality record.</p></div><Button onClick={()=>setOpen(true)}><Plus size={16}/> New inspection</Button></div>{message&&<div className="notice">{message}</div>}<div className="inspectionDashboard"><section className="inspectionSummaryCard"><div><p className="eyebrow">Portfolio quality</p><h2>Average inspection score</h2><p>Completed quality reviews across all facilities.</p></div><ScoreRing value={data.inspections.filter(i=>i.status==='completed').length?data.inspections.filter(i=>i.status==='completed').reduce((s,i)=>s+Number(i.overall_score||0),0)/data.inspections.filter(i=>i.status==='completed').length:0}/></section><div className="inspectionMetricCards"><article><ScanSearch size={20}/><strong>{data.inspections.length}</strong><span>Total inspections</span></article><article><ThumbsUp size={20}/><strong>{data.inspections.filter(i=>Number(i.overall_score)>=90).length}</strong><span>Excellent</span></article><article><AlertTriangle size={20}/><strong>{data.inspections.filter(i=>i.status==='completed'&&Number(i.overall_score)<80).length}</strong><span>Needs attention</span></article></div></div><div className="inspectionCardGrid">{data.inspections.map(i=>{const facility=data.facilities.find(f=>f.id===i.facility_id);const areas=data.inspectionAreas.filter(a=>a.inspection_id===i.id);return <button className="inspectionCard" key={i.id} onClick={()=>setSelected(i)}><div className="inspectionCardTop"><div className="inspectionIcon"><ScanSearch size={21}/></div><div className={`status ${i.status}`}>{i.status}</div></div><h2>{i.title}</h2><p>{facility?.name||'Facility'}</p><div className="inspectionCardScore"><strong>{Math.round(Number(i.overall_score||0))}</strong><span>quality score</span></div><div className="facilityCardFooter"><span>{areas.length} areas</span><ChevronRight size={17}/></div></button>})}{!data.inspections.length&&<Empty title="No inspections" text="Create the first facility quality inspection."/>}</div><Modal open={open} title="New inspection" onClose={()=>setOpen(false)}><div className="form"><label>Customer<select value={form.customer_id} onChange={e=>setForm({...form,customer_id:e.target.value,facility_id:'',work_order_id:''})}><option value="">Select...</option>{data.customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Facility<select value={form.facility_id} onChange={e=>setForm({...form,facility_id:e.target.value,work_order_id:''})}><option value="">Select...</option>{facilities.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label><label>Related work order<select value={form.work_order_id} onChange={e=>setForm({...form,work_order_id:e.target.value})}><option value="">Optional...</option>{workOrders.map(w=><option key={w.id} value={w.id}>{w.title} · {w.scheduled_date}</option>)}</select></label><label>Inspection title<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label>Areas<input value={form.area_names} onChange={e=>setForm({...form,area_names:e.target.value})}/></label><Button onClick={save}>Create inspection</Button></div></Modal></div>}
function InspectionReports({profile,data}){const completed=data.inspections.filter(i=>i.status==='completed'&&(!profile.customer_id||i.customer_id===profile.customer_id));return <div className="page"><div className="pageHeader"><div><p className="eyebrow">Quality reports</p><h1>Inspection reports</h1><p>Verified facility quality scores and before/after evidence.</p></div></div>{completed.map(i=>{const facility=data.facilities.find(f=>f.id===i.facility_id);const areas=data.inspectionAreas.filter(a=>a.inspection_id===i.id);const photos=data.inspectionPhotos.filter(p=>p.inspection_id===i.id);return <section className="panel customerInspectionReport" key={i.id}><div className="panelTitle"><div><p className="eyebrow">{facility?.name||'Facility'}</p><h2>{i.title}</h2><p>{i.inspected_at?new Date(i.inspected_at).toLocaleDateString():''}</p></div><ScoreRing value={i.overall_score}/></div><p className="reportNarrative">{i.summary||'Inspection completed.'}</p><div className="qualityAreaGrid">{areas.map(a=><div className={`qualityArea ${a.status}`} key={a.id}><strong>{a.area_name}</strong><span>{Math.round(Number(a.score||0))}%</span></div>)}</div>{!!photos.length&&<div className="proofGrid">{photos.slice(0,8).map(p=><figure key={p.id}><img src={p.file_url}/><figcaption>{p.photo_type}</figcaption></figure>)}</div>}</section>})}{!completed.length&&<Empty title="No inspection reports yet" text="Completed quality inspections will appear here."/>}</div>}
function FinanceSummary({data,setPage}) {
  const invoiceTotal=data.invoices.reduce((s,x)=>s+Number(x.amount||0),0);
  const paidTotal=data.payments.reduce((s,x)=>s+Number(x.amount||0),0);
  const expenseTotal=data.expenses.reduce((s,x)=>s+Number(x.amount||0),0);
  const payrollTotal=data.payroll.reduce((s,x)=>s+Number(x.gross_pay||0),0);
  const outstanding=Math.max(0,invoiceTotal-paidTotal);
  return <div className="page financeHome">
    <div className="pageHeader"><div><p className="eyebrow">Finance engine</p><h1>Financial control center</h1><p>Quotes, billing, cash received, expenses, and payroll in one workspace.</p></div></div>
    <div className="metricGrid financeMetrics">
      <button className="metricCard" onClick={()=>setPage('invoices')}><div className="metricIcon blue"><Receipt size={21}/></div><span>Invoiced</span><strong>${invoiceTotal.toLocaleString()}</strong><small>{data.invoices.length} invoices</small></button>
      <button className="metricCard" onClick={()=>setPage('payments')}><div className="metricIcon green"><CreditCard size={21}/></div><span>Payments received</span><strong>${paidTotal.toLocaleString()}</strong><small>{data.payments.length} payments</small></button>
      <button className="metricCard" onClick={()=>setPage('invoices')}><div className="metricIcon amber"><WalletCards size={21}/></div><span>Outstanding</span><strong>${outstanding.toLocaleString()}</strong><small>Invoice balance</small></button>
      <button className="metricCard" onClick={()=>setPage('expenses')}><div className="metricIcon red"><Banknote size={21}/></div><span>Expenses</span><strong>${expenseTotal.toLocaleString()}</strong><small>{data.expenses.length} entries</small></button>
      <button className="metricCard" onClick={()=>setPage('payroll')}><div className="metricIcon violet"><CircleUserRound size={21}/></div><span>Payroll</span><strong>${payrollTotal.toLocaleString()}</strong><small>{data.payroll.length} entries</small></button>
    </div>
    <div className="dashboardGrid">
      <section className="panel">
        <div className="panelTitle"><div><p className="eyebrow">Recent billing</p><h2>Invoices</h2></div><button className="link" onClick={()=>setPage('invoices')}>Open invoices</button></div>
        {data.invoices.slice(0,6).map(i=><div className="financeRow" key={i.id}><div className="financeDocIcon"><Receipt size={18}/></div><div className="grow"><strong>{i.invoice_number||'Invoice'}</strong><span>{data.customers.find(c=>c.id===i.customer_id)?.name||'Customer'} · due {i.due_date||'not set'}</span></div><b>${Number(i.amount||0).toLocaleString()}</b><div className={`status ${i.status}`}>{i.status}</div></div>)}
        {!data.invoices.length&&<Empty title="No invoices" text="Create the first customer invoice."/>}
      </section>
      <section className="attentionPanel financeAttention">
        <div className="panelTitle"><div><p className="eyebrow">Finance actions</p><h2>Quick access</h2></div></div>
        <button onClick={()=>setPage('quotes')}><FileText size={18}/><div><strong>Create a quote</strong><span>Build a customer proposal</span></div><ChevronRight size={17}/></button>
        <button onClick={()=>setPage('invoices')}><Receipt size={18}/><div><strong>Create an invoice</strong><span>Bill recurring or extra work</span></div><ChevronRight size={17}/></button>
        <button onClick={()=>setPage('payments')}><CreditCard size={18}/><div><strong>Record payment</strong><span>Update customer balances</span></div><ChevronRight size={17}/></button>
        <button onClick={()=>setPage('expenses')}><Banknote size={18}/><div><strong>Record expense</strong><span>Supplies, mileage, vendors</span></div><ChevronRight size={17}/></button>
      </section>
    </div>
  </div>;
}

function QuotesPage({data,companyId,reload}) {
  const blank={customer_id:'',facility_id:'',quote_number:`Q-${Date.now().toString().slice(-6)}`,title:'Recurring Cleaning Service',amount:0,status:'draft',valid_until:'',notes:''};
  const [open,setOpen]=useState(false);const [form,setForm]=useState(blank);const [message,setMessage]=useState('');
  const facilities=data.facilities.filter(f=>!form.customer_id||f.customer_id===form.customer_id);
  async function save(){if(!form.title)return setMessage('Title is required.');const{error}=await createQuote(companyId,form);if(error)return setMessage(error.message);setOpen(false);setForm({...blank,quote_number:`Q-${Date.now().toString().slice(-6)}`});await reload()}
  async function status(id,status){const{error}=await updateRecord('quotes',id,{status});if(error)return setMessage(error.message);await reload()}
  return <div className="page"><div className="pageHeader"><div><p className="eyebrow">Finance</p><h1>Quotes</h1><p>Create proposals and track acceptance.</p></div><Button onClick={()=>setOpen(true)}><Plus size={16}/> New quote</Button></div>{message&&<div className="notice">{message}</div>}<div className="financeCards">{data.quotes.map(q=><article className="financeCard" key={q.id}><div className="objectHead"><div className="financeDocIcon"><FileText size={20}/></div><div className={`status ${q.status}`}>{q.status}</div></div><p className="eyebrow">{q.quote_number||'Quote'}</p><h2>{q.title}</h2><p>{data.customers.find(c=>c.id===q.customer_id)?.name||'Customer'}</p><strong className="money">${Number(q.amount||0).toLocaleString()}</strong><div className="cardActions"><button onClick={()=>status(q.id,'sent')}>Mark sent</button><button onClick={()=>status(q.id,'accepted')}>Accept</button><button onClick={()=>status(q.id,'rejected')}>Reject</button></div></article>)}{!data.quotes.length&&<Empty title="No quotes" text="Create your first proposal."/>}</div><Modal open={open} title="New quote" onClose={()=>setOpen(false)}><div className="form"><label>Customer<select value={form.customer_id} onChange={e=>setForm({...form,customer_id:e.target.value,facility_id:''})}><option value="">Select...</option>{data.customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Facility<select value={form.facility_id} onChange={e=>setForm({...form,facility_id:e.target.value})}><option value="">Optional...</option>{facilities.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label><div className="form2"><label>Quote number<input value={form.quote_number} onChange={e=>setForm({...form,quote_number:e.target.value})}/></label><label>Valid until<input type="date" value={form.valid_until} onChange={e=>setForm({...form,valid_until:e.target.value})}/></label></div><label>Title<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label>Amount<input type="number" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label><label>Notes<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label><Button onClick={save}>Create quote</Button></div></Modal></div>;
}

function InvoicesPage({data,companyId,reload}) {
  const blank={customer_id:'',facility_id:'',invoice_number:`INV-${Date.now().toString().slice(-6)}`,amount:0,due_date:'',status:'draft',notes:''};
  const [open,setOpen]=useState(false);const [form,setForm]=useState(blank);const [message,setMessage]=useState('');
  const facilities=data.facilities.filter(f=>!form.customer_id||f.customer_id===form.customer_id);
  async function save(){const{error}=await createInvoice(companyId,form);if(error)return setMessage(error.message);setOpen(false);setForm({...blank,invoice_number:`INV-${Date.now().toString().slice(-6)}`});await reload()}
  async function status(id,status){const{error}=await updateRecord('invoices',id,{status});if(error)return setMessage(error.message);await reload()}
  return <div className="page"><div className="pageHeader"><div><p className="eyebrow">Finance</p><h1>Invoices</h1><p>Bill customers and monitor outstanding balances.</p></div><Button onClick={()=>setOpen(true)}><Plus size={16}/> New invoice</Button></div>{message&&<div className="notice">{message}</div>}<section className="panel financeTable">{data.invoices.map(i=><div className="financeRow" key={i.id}><div className="financeDocIcon"><Receipt size={18}/></div><div className="grow"><strong>{i.invoice_number||'Invoice'}</strong><span>{data.customers.find(c=>c.id===i.customer_id)?.name||'Customer'} · due {i.due_date||'not set'}</span></div><b>${Number(i.amount||0).toLocaleString()}</b><div className={`status ${i.status}`}>{i.status}</div><div className="rowActions"><button onClick={()=>status(i.id,'sent')}>Sent</button><button onClick={()=>status(i.id,'paid')}>Paid</button></div></div>)}{!data.invoices.length&&<Empty title="No invoices" text="Create your first invoice."/>}</section><Modal open={open} title="New invoice" onClose={()=>setOpen(false)}><div className="form"><label>Customer<select value={form.customer_id} onChange={e=>setForm({...form,customer_id:e.target.value,facility_id:''})}><option value="">Select...</option>{data.customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Facility<select value={form.facility_id} onChange={e=>setForm({...form,facility_id:e.target.value})}><option value="">Optional...</option>{facilities.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label><div className="form2"><label>Invoice number<input value={form.invoice_number} onChange={e=>setForm({...form,invoice_number:e.target.value})}/></label><label>Due date<input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})}/></label></div><label>Amount<input type="number" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label><label>Notes<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label><Button onClick={save}>Create invoice</Button></div></Modal></div>;
}

function PaymentsPage({data,companyId,reload}) {
  const blank={invoice_id:'',customer_id:'',amount:0,payment_date:new Date().toISOString().slice(0,10),method:'ACH'};
  const [open,setOpen]=useState(false);const [form,setForm]=useState(blank);const [message,setMessage]=useState('');
  function chooseInvoice(id){const invoice=data.invoices.find(i=>i.id===id);setForm({...form,invoice_id:id,customer_id:invoice?.customer_id||'',amount:invoice?.amount||0})}
  async function save(){const{error}=await createPayment(companyId,form);if(error)return setMessage(error.message);if(form.invoice_id)await updateRecord('invoices',form.invoice_id,{status:'paid'});setOpen(false);setForm(blank);await reload()}
  return <div className="page"><div className="pageHeader"><div><p className="eyebrow">Finance</p><h1>Payments</h1><p>Record money received and close invoice balances.</p></div><Button onClick={()=>setOpen(true)}><Plus size={16}/> Record payment</Button></div>{message&&<div className="notice">{message}</div>}<section className="panel financeTable">{data.payments.map(p=><div className="financeRow" key={p.id}><div className="financeDocIcon"><CreditCard size={18}/></div><div className="grow"><strong>{data.customers.find(c=>c.id===p.customer_id)?.name||'Customer payment'}</strong><span>{p.payment_date} · {p.method||'Method not set'}</span></div><b className="positiveMoney">+${Number(p.amount||0).toLocaleString()}</b><div className="status completed">{p.status}</div></div>)}{!data.payments.length&&<Empty title="No payments" text="Received payments will appear here."/>}</section><Modal open={open} title="Record payment" onClose={()=>setOpen(false)}><div className="form"><label>Invoice<select value={form.invoice_id} onChange={e=>chooseInvoice(e.target.value)}><option value="">Select invoice...</option>{data.invoices.filter(i=>i.status!=='paid').map(i=><option key={i.id} value={i.id}>{i.invoice_number} — ${i.amount}</option>)}</select></label><label>Customer<select value={form.customer_id} onChange={e=>setForm({...form,customer_id:e.target.value})}><option value="">Select...</option>{data.customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><div className="form2"><label>Amount<input type="number" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label><label>Date<input type="date" value={form.payment_date} onChange={e=>setForm({...form,payment_date:e.target.value})}/></label></div><label>Method<select value={form.method} onChange={e=>setForm({...form,method:e.target.value})}><option>ACH</option><option>Check</option><option>Cash</option><option>Credit Card</option><option>Zelle</option></select></label><Button onClick={save}>Record payment</Button></div></Modal></div>;
}

function ExpensesPage({data,companyId,reload}) {
  const blank={category:'supplies',vendor:'',amount:0,expense_date:new Date().toISOString().slice(0,10),notes:''};
  const [open,setOpen]=useState(false);const [form,setForm]=useState(blank);const [message,setMessage]=useState('');
  async function save(){const{error}=await createExpense(companyId,form);if(error)return setMessage(error.message);setOpen(false);setForm(blank);await reload()}
  return <div className="page"><div className="pageHeader"><div><p className="eyebrow">Finance</p><h1>Expenses</h1><p>Track supplies, mileage, vendors, and operating costs.</p></div><Button onClick={()=>setOpen(true)}><Plus size={16}/> New expense</Button></div>{message&&<div className="notice">{message}</div>}<section className="panel financeTable">{data.expenses.map(e=><div className="financeRow" key={e.id}><div className="financeDocIcon expense"><Banknote size={18}/></div><div className="grow"><strong>{e.vendor||e.category}</strong><span>{e.expense_date} · {e.category} · {e.notes||'No notes'}</span></div><b className="negativeMoney">-${Number(e.amount||0).toLocaleString()}</b></div>)}{!data.expenses.length&&<Empty title="No expenses" text="Record your first business expense."/>}</section><Modal open={open} title="New expense" onClose={()=>setOpen(false)}><div className="form"><div className="form2"><label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option>supplies</option><option>mileage</option><option>equipment</option><option>contractor</option><option>insurance</option><option>other</option></select></label><label>Vendor<input value={form.vendor} onChange={e=>setForm({...form,vendor:e.target.value})}/></label></div><div className="form2"><label>Amount<input type="number" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label><label>Date<input type="date" value={form.expense_date} onChange={e=>setForm({...form,expense_date:e.target.value})}/></label></div><label>Notes<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label><Button onClick={save}>Record expense</Button></div></Modal></div>;
}

function PayrollPage({data,companyId,reload}) {
  const blank={employee_profile_id:'',period_start:'',period_end:'',hours:0,hourly_rate:25,status:'draft'};
  const [open,setOpen]=useState(false);const [form,setForm]=useState(blank);const [message,setMessage]=useState('');
  const employees=data.people.filter(p=>['employee','manager'].includes(p.role));
  async function save(){const{error}=await createPayrollEntry(companyId,form);if(error)return setMessage(error.message);setOpen(false);setForm(blank);await reload()}
  return <div className="page"><div className="pageHeader"><div><p className="eyebrow">Finance</p><h1>Payroll</h1><p>Calculate employee hours and gross pay by period.</p></div><Button onClick={()=>setOpen(true)}><Plus size={16}/> Payroll entry</Button></div>{message&&<div className="notice">{message}</div>}<section className="panel financeTable">{data.payroll.map(p=><div className="financeRow" key={p.id}><div className="financeDocIcon payroll"><CircleUserRound size={18}/></div><div className="grow"><strong>{data.people.find(x=>x.id===p.employee_profile_id)?.full_name||'Employee'}</strong><span>{p.period_start||'—'} to {p.period_end||'—'} · {p.hours||0} hours at ${p.hourly_rate||0}/hr</span></div><b>${Number(p.gross_pay||0).toLocaleString()}</b><div className={`status ${p.status}`}>{p.status}</div></div>)}{!data.payroll.length&&<Empty title="No payroll entries" text="Create the first pay-period calculation."/>}</section><Modal open={open} title="New payroll entry" onClose={()=>setOpen(false)}><div className="form"><label>Employee<select value={form.employee_profile_id} onChange={e=>setForm({...form,employee_profile_id:e.target.value})}><option value="">Select...</option>{employees.map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}</select></label><div className="form2"><label>Period start<input type="date" value={form.period_start} onChange={e=>setForm({...form,period_start:e.target.value})}/></label><label>Period end<input type="date" value={form.period_end} onChange={e=>setForm({...form,period_end:e.target.value})}/></label></div><div className="form2"><label>Hours<input type="number" step="0.25" value={form.hours} onChange={e=>setForm({...form,hours:e.target.value})}/></label><label>Hourly rate<input type="number" step="0.01" value={form.hourly_rate} onChange={e=>setForm({...form,hourly_rate:e.target.value})}/></label></div><div className="payPreview"><span>Gross pay</span><strong>${(Number(form.hours||0)*Number(form.hourly_rate||0)).toFixed(2)}</strong></div><Button onClick={save}>Create payroll entry</Button></div></Modal></div>;
}

function ModulePlaceholder({title,description}){return <div className="page"><div className="pageHeader"><div><p className="eyebrow">FacilityOS module</p><h1>{title}</h1><p>{description}</p></div></div><section className="panel"><Empty title={`${title} workspace`} text="The navigation and data foundation are active. This module is ready for its detailed workflow in the next operational release."/></section></div>}

function CalendarPage({data,companyId,reload}) {
  const [planOpen,setPlanOpen]=useState(false);
  const [form,setForm]=useState({customer_id:'',facility_id:'',name:'Weekly Cleaning',frequency:'weekly',weekdays:[6],start_date:new Date().toISOString().slice(0,10),default_time:'09:00',assigned_to_profile_id:'',estimated_minutes:90,visit_price:0});
  const [message,setMessage]=useState('');
  const [view,setView]=useState('week');
  const [anchor,setAnchor]=useState(new Date());
  const facilities=data.facilities.filter(f=>!form.customer_id||f.customer_id===form.customer_id);
  const employees=data.people.filter(p=>p.role==='employee'||p.role==='manager');
  const customer=id=>data.customers.find(c=>c.id===id);
  const facility=id=>data.facilities.find(f=>f.id===id);
  const employee=id=>data.people.find(p=>p.id===id);

  const startOfWeek=new Date(anchor);
  startOfWeek.setDate(anchor.getDate()-((anchor.getDay()+6)%7));
  startOfWeek.setHours(0,0,0,0);
  const days=Array.from({length:view==='week'?7:14},(_,i)=>{const d=new Date(startOfWeek);d.setDate(d.getDate()+i);return d});
  const dateKey=d=>d.toISOString().slice(0,10);

  async function savePlan(){
    const {data:plan,error}=await createServicePlan(companyId,form);
    if(error)return setMessage(error.message);
    setPlanOpen(false);
    const generated=await generateVisits(companyId,plan,3);
    setMessage(generated.error?`Plan created, but visits were not generated: ${generated.error.message}`:'Plan created and next 3 months generated.');
    reload();
  }

  function shift(amount){const next=new Date(anchor);next.setDate(next.getDate()+amount);setAnchor(next)}
  const ordersByDate=days.reduce((acc,d)=>{acc[dateKey(d)]=data.workOrders.filter(w=>w.scheduled_date===dateKey(d)&&w.status!=='archived');return acc},{});

  return <div className="page calendarV2">
    <div className="pageHeader">
      <div><p className="eyebrow">Scheduling engine</p><h1>Operations calendar</h1><p>Plan recurring service and see work orders by day.</p></div>
      <Button onClick={()=>setPlanOpen(true)}><Plus size={16}/> Recurring service</Button>
    </div>
    {message&&<div className="notice">{message}</div>}

    <section className="calendarToolbar">
      <div className="segmented">
        <button className={view==='week'?'active':''} onClick={()=>setView('week')}>Week</button>
        <button className={view==='fortnight'?'active':''} onClick={()=>setView('fortnight')}>2 weeks</button>
      </div>
      <div className="calendarNav">
        <button onClick={()=>shift(view==='week'?-7:-14)}>‹</button>
        <strong>{startOfWeek.toLocaleDateString(undefined,{month:'long',day:'numeric'})}</strong>
        <button onClick={()=>shift(view==='week'?7:14)}>›</button>
        <button onClick={()=>setAnchor(new Date())}>Today</button>
      </div>
    </section>

    <section className={`calendarBoard ${view}`}>
      {days.map(d=>{
        const key=dateKey(d);const orders=ordersByDate[key]||[];
        return <article className={key===new Date().toISOString().slice(0,10)?'calendarDay today':'calendarDay'} key={key}>
          <header><span>{d.toLocaleDateString(undefined,{weekday:'short'})}</span><strong>{d.getDate()}</strong></header>
          <div className="calendarJobs">
            {orders.map(order=><button className={`calendarJob ${order.status}`} key={order.id}>
              <span>{order.scheduled_time?.slice(0,5)||'Any'}</span>
              <strong>{facility(order.facility_id)?.name||order.title}</strong>
              <small>{employee(order.assigned_to_profile_id)?.full_name||'Unassigned'}</small>
            </button>)}
            {!orders.length&&<div className="calendarEmpty">No jobs</div>}
          </div>
        </article>
      })}
    </section>

    <div className="grid2">
      <section className="panel">
        <div className="panelTitle"><h2>Recurring service plans</h2><span>{data.plans.length}</span></div>
        {data.plans.map(p=><div className="planRow" key={p.id}><div><strong>{p.name}</strong><span>{facility(p.facility_id)?.name} · {p.frequency} · {p.default_time}</span></div><div className="status active">active</div></div>)}
        {!data.plans.length&&<Empty title="No recurring plans" text="Create the first recurring cleaning schedule."/>}
      </section>
      <section className="panel">
        <div className="panelTitle"><h2>Unassigned work</h2><span>{data.workOrders.filter(w=>!w.assigned_to_profile_id&&w.status!=='archived').length}</span></div>
        {data.workOrders.filter(w=>!w.assigned_to_profile_id&&w.status!=='archived').slice(0,8).map(w=><div className="simpleRow" key={w.id}><CalendarDays size={18}/><div><strong>{facility(w.facility_id)?.name||w.title}</strong><span>{w.scheduled_date} · {customer(w.customer_id)?.name}</span></div></div>)}
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
      <Button onClick={savePlan}>Create and generate</Button>
    </div></Modal>
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
function ModernSettingsPage(){
  const [checks,setChecks]=useState([]);
  const [checking,setChecking]=useState(false);
  const [message,setMessage]=useState('');
  async function runHealthCheck(){
    setChecking(true);setMessage('');
    try{setChecks(await checkInfrastructure())}
    catch(error){setMessage(error.message)}
    finally{setChecking(false)}
  }
  function openSection(section){
    const labels={company:'Company',branding:'Branding',users:'Users & roles',notifications:'Notifications',documents:'Documents',billing:'Billing',integrations:'Integrations',security:'Security',health:'System health'};
    setMessage(`${labels[section]||'This section'} is organized and ready for its detailed controls in the next increment.`);
  }
  return <><SettingsHub healthChecks={checks} checking={checking} onRunHealthCheck={runHealthCheck} onOpenSection={openSection}/>{message&&<div className="settingsToast notice">{message}</div>}</>;
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
  const orders=data.workOrders.filter(order=>order.customer_id===profile.customer_id&&order.status==='verified').sort((a,b)=>(b.verified_at||b.completed_at||'').localeCompare(a.verified_at||a.completed_at||''));
  return <div className="page"><div className="pageHeader"><div><p className="eyebrow">Verified work</p><h1>Service reports</h1><p>Manager-approved cleaning results for your facilities.</p></div></div>{orders.map(order=>{const facility=data.facilities.find(f=>f.id===order.facility_id);const employee=data.people.find(p=>p.id===order.assigned_to_profile_id);const areas=data.workOrderAreas.filter(a=>a.work_order_id===order.id);const usage=data.supplyUsage.filter(u=>u.work_order_id===order.id);return <section className="serviceReport customerReport" key={order.id}><div className="reportHeader"><div><p className="eyebrow">{order.scheduled_date}</p><h2>{facility?.name||order.title}</h2><p>{order.customer_summary||'Service completed and verified by management.'}</p></div><div className="qualityRing">{order.quality_score||100}<small>/100</small></div></div><div className="reportFacts"><span><b>{employee?.full_name||'Service team'}</b> completed by</span><span><b>{areas.filter(a=>a.status==='completed').length}/{areas.length}</b> areas</span><span><b>{order.estimated_minutes||0} min</b> planned</span><span><b>{usage.length}</b> supply entries</span></div><div className="reportAreaGrid">{areas.map(area=><div key={area.id}><CheckCircle2 size={17}/><span>{area.name}</span></div>)}</div></section>})}{!orders.length&&<Empty title="No verified reports yet" text="Reports appear after a manager approves a completed work order."/>}</div>;
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
    else if(page==='customers') content=<CustomersPage data={data} companyId={profile.company_id} reload={reload} setPage={setPage}/>;
    else if(page==='contacts') content=<ContactsPage data={data} companyId={profile.company_id} reload={reload}/>;
    else if(page==='facilities') content=<FacilitiesPage data={data} companyId={profile.company_id} reload={reload}/>;
    else if(page==='work-orders') content=<WorkOrdersPage data={data} companyId={profile.company_id} profile={profile} reload={reload}/>;
    else if(page==='calendar') content=<CalendarPage data={data} companyId={profile.company_id} reload={reload}/>;
    else if(page==='employees') content=<EmployeesPage data={data} companyId={profile.company_id} reload={reload}/>;
    else if(page==='issues') content=<IssuesPage data={data}/>;
    else if(page==='supplies') content=<SuppliesPage data={data} companyId={profile.company_id} reload={reload}/>;
    else if(page==='quotes') content=<QuotesPage data={data} companyId={profile.company_id} reload={reload}/>;
    else if(page==='inspections') content=<InspectionsPage data={data} companyId={profile.company_id} profile={profile} reload={reload}/>;
    else if(page==='invoices') content=<InvoicesPage data={data} companyId={profile.company_id} reload={reload}/>;
    else if(page==='payments') content=<PaymentsPage data={data} companyId={profile.company_id} reload={reload}/>;
    else if(page==='payroll') content=<PayrollPage data={data} companyId={profile.company_id} reload={reload}/>;
    else if(page==='expenses') content=<ExpensesPage data={data} companyId={profile.company_id} reload={reload}/>;
    else if(page==='billing') content=<FinanceSummary data={data} setPage={setPage}/>;
    else if(page==='contractors') content=<ModulePlaceholder title="Contractors" description="Manage outsourced cleaners, plumbers, electricians, and other service partners."/>;
    else if(page==='reports') content=<ModulePlaceholder title="Reports" description="Operations, proof-of-service, customer, financial, and employee performance reports."/>;
    else content=<ModernSettingsPage/>;
  } else if(portal==='employee') {
    content=<EmployeeWorkOrders profile={profile} data={data} reload={reload}/>;
  } else {
    if(page==='customer-proof') content=<InspectionReports profile={profile} data={data}/>;
    else if(page==='customer-requests') content=<CustomerRequests profile={profile} data={data} reload={reload}/>;
    else content=<CustomerHome profile={profile} data={data}/>;
  }

  return <Shell profile={profile} portal={portal} setPortal={setPortal} page={page} setPage={setPage} data={data}>{content}</Shell>;
}
