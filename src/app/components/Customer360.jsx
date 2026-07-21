import { useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowLeft, Building2, CalendarDays, CheckCircle2, CircleUserRound, ClipboardCheck, DollarSign, FileText, History, Mail, MapPin, MessageSquareText, Phone, Plus, Receipt, ShieldCheck, Sparkles, TrendingUp, Wrench } from 'lucide-react';
import './Customer360.css';

const tabs=['Overview','Facilities','Operations','Communications','Financial','Documents','Analytics'];
const money=value=>`$${Number(value||0).toLocaleString()}`;
const date=value=>value?new Date(value).toLocaleDateString():'Not scheduled';

function Empty({title,text}){return <div className="c360Empty"><Sparkles size={21}/><strong>{title}</strong><span>{text}</span></div>}
function Metric({icon:Icon,label,value,note,tone=''}){return <article className={`c360Metric ${tone}`}><div><Icon size={18}/></div><span>{label}</span><strong>{value}</strong><small>{note}</small></article>}

export function Customer360({customer,data,onBack,onEdit,onNavigate,onArchive}){
  const [tab,setTab]=useState('Overview');
  const records=useMemo(()=>{
    const byCustomer=list=>(list||[]).filter(item=>item.customer_id===customer.id);
    const facilities=byCustomer(data.facilities);
    const contacts=byCustomer(data.contacts);
    const workOrders=byCustomer(data.workOrders).filter(x=>x.status!=='archived');
    const issues=byCustomer(data.issues);
    const requests=byCustomer(data.requests);
    const quotes=byCustomer(data.quotes);
    const invoices=byCustomer(data.invoices);
    const payments=byCustomer(data.payments);
    const inspections=byCustomer(data.inspections);
    const totalInvoiced=invoices.reduce((sum,x)=>sum+Number(x.amount||0),0);
    const totalPaid=payments.reduce((sum,x)=>sum+Number(x.amount||0),0);
    const openOrders=workOrders.filter(x=>!['verified','completed'].includes(x.status));
    const openIssues=issues.filter(x=>x.status!=='closed');
    const nextOrder=[...workOrders].filter(x=>x.scheduled_date&&new Date(x.scheduled_date)>=new Date(new Date().toDateString())).sort((a,b)=>new Date(a.scheduled_date)-new Date(b.scheduled_date))[0];
    const lastOrder=[...workOrders].filter(x=>['verified','completed'].includes(x.status)).sort((a,b)=>new Date(b.completed_at||b.updated_at||b.scheduled_date||0)-new Date(a.completed_at||a.updated_at||a.scheduled_date||0))[0];
    const scores=inspections.map(x=>Number(x.score||x.overall_score||0)).filter(Boolean);
    const inspectionScore=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):null;
    const health=Math.max(45,Math.min(100,100-openIssues.length*8-openOrders.filter(x=>x.status==='overdue').length*12-(totalInvoiced-totalPaid>0?5:0)));
    const activity=[
      ...workOrders.map(x=>({type:'work',date:x.completed_at||x.updated_at||x.created_at||x.scheduled_date,title:x.title||'Service visit',detail:`Work order · ${x.status}`})),
      ...issues.map(x=>({type:'issue',date:x.created_at,title:x.title||'Facility issue',detail:`Issue · ${x.status}`})),
      ...requests.map(x=>({type:'request',date:x.created_at,title:x.title||'Customer request',detail:`Request · ${x.status}`})),
      ...quotes.map(x=>({type:'quote',date:x.created_at,title:x.quote_number||x.title||'Quote',detail:`Quote · ${x.status}`})),
      ...invoices.map(x=>({type:'invoice',date:x.created_at,title:x.invoice_number||'Invoice',detail:`Invoice · ${x.status}`})),
      ...payments.map(x=>({type:'payment',date:x.created_at,title:'Payment received',detail:money(x.amount)}))
    ].sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
    return {facilities,contacts,workOrders,issues,requests,quotes,invoices,payments,inspections,totalInvoiced,totalPaid,openOrders,openIssues,nextOrder,lastOrder,inspectionScore,health,activity};
  },[customer,data]);

  const quick=[['work-orders','Work order',ClipboardCheck],['calendar','Schedule',CalendarDays],['quotes','Quote',FileText],['invoices','Invoice',Receipt],['communications','Message',MessageSquareText],['issues','Issue',AlertTriangle]];

  return <div className="page customer360">
    <button className="c360Back" onClick={onBack}><ArrowLeft size={18}/> Customers</button>
    <section className="c360Hero">
      <div className="c360Identity"><div className="c360Avatar">{customer.name?.slice(0,1)||'C'}</div><div><p className="eyebrow">Customer 360</p><h1>{customer.name}</h1><div className="c360Meta"><span className="c360Status">Active</span><span>{customer.customer_type||'Commercial'}</span>{customer.address&&<span><MapPin size={14}/>{customer.address}</span>}</div></div></div>
      <div className="c360HeroStats"><div><span>Health</span><strong>{records.health}</strong><small>/100</small></div><div><span>Monthly value</span><strong>{money(customer.monthly_value)}</strong></div></div>
      <div className="c360HeroActions"><button className="btn secondary" onClick={()=>onEdit(customer)}>Edit</button><button className="btn primary" onClick={()=>onNavigate('work-orders')}><Plus size={16}/> New work order</button></div>
    </section>

    <div className="c360ContactBar"><span><Mail size={15}/>{customer.email||'No primary email'}</span><span><Phone size={15}/>{customer.phone||'No phone number'}</span><span><CircleUserRound size={15}/>{records.contacts[0]?.full_name||'No primary contact'}</span><span><CalendarDays size={15}/>Next: {date(records.nextOrder?.scheduled_date)}</span></div>

    <section className="c360Metrics">
      <Metric icon={Building2} label="Facilities" value={records.facilities.length} note="Managed locations"/>
      <Metric icon={ClipboardCheck} label="Open work orders" value={records.openOrders.length} note={`${records.workOrders.length} total`}/>
      <Metric icon={AlertTriangle} label="Open issues" value={records.openIssues.length} note={records.openIssues.length?'Needs attention':'All clear'} tone={records.openIssues.length?'warn':''}/>
      <Metric icon={Receipt} label="Outstanding" value={money(Math.max(0,records.totalInvoiced-records.totalPaid))} note={`${money(records.totalPaid)} paid`}/>
      <Metric icon={ShieldCheck} label="Inspection score" value={records.inspectionScore?`${records.inspectionScore}%`:'—'} note={`${records.inspections.length} inspections`}/>
      <Metric icon={TrendingUp} label="Customer health" value={`${records.health}%`} note={records.health>=85?'Strong account':'Review account'}/>
    </section>

    <nav className="c360Tabs">{tabs.map(name=><button key={name} className={tab===name?'active':''} onClick={()=>setTab(name)}>{name}</button>)}</nav>

    {tab==='Overview'&&<div className="c360Grid">
      <section className="c360Panel c360Wide"><div className="c360PanelHead"><div><p className="eyebrow">Command center</p><h2>Account overview</h2></div><Activity size={18}/></div><div className="c360OverviewRows"><div><span>Last completed service</span><strong>{date(records.lastOrder?.scheduled_date||records.lastOrder?.completed_at)}</strong></div><div><span>Next scheduled visit</span><strong>{date(records.nextOrder?.scheduled_date)}</strong></div><div><span>Active facilities</span><strong>{records.facilities.length}</strong></div><div><span>Outstanding balance</span><strong>{money(Math.max(0,records.totalInvoiced-records.totalPaid))}</strong></div></div></section>
      <section className="c360Panel"><div className="c360PanelHead"><div><p className="eyebrow">Actions</p><h2>Quick launch</h2></div></div><div className="c360Quick">{quick.map(([page,label,Icon])=><button key={page} onClick={()=>onNavigate(page)}><Icon size={17}/><span>{label}</span></button>)}</div></section>
      <section className="c360Panel c360Wide"><div className="c360PanelHead"><div><p className="eyebrow">History</p><h2>Unified activity</h2></div><History size={18}/></div><div className="c360Timeline">{records.activity.slice(0,10).map((item,index)=><article key={`${item.type}-${index}`}><i className={item.type}/><div><strong>{item.title}</strong><span>{item.detail}</span></div><time>{date(item.date)}</time></article>)}{!records.activity.length&&<Empty title="No account activity" text="Service, financial, and communication records will appear here."/>}</div></section>
      <section className="c360Panel"><div className="c360PanelHead"><div><p className="eyebrow">Attention</p><h2>Account signals</h2></div></div><div className="c360Signals"><div><CheckCircle2 size={17}/><span>{records.workOrders.filter(x=>['verified','completed'].includes(x.status)).length} completed services</span></div><div><AlertTriangle size={17}/><span>{records.openIssues.length} unresolved issues</span></div><div><DollarSign size={17}/><span>{money(records.totalInvoiced)} invoiced</span></div></div></section>
    </div>}

    {tab==='Facilities'&&<section className="c360Cards">{records.facilities.map(f=><article key={f.id}><div className="c360CardIcon"><Building2 size={20}/></div><div><h3>{f.name}</h3><p>{f.facility_type||'Facility'}</p><span><MapPin size={14}/>{f.address||'No address'}</span></div><button onClick={()=>onNavigate('facilities')}>Open</button></article>)}{!records.facilities.length&&<Empty title="No facilities" text="Add the first managed location for this customer."/>}</section>}

    {tab==='Operations'&&<section className="c360Panel"><div className="c360PanelHead"><div><p className="eyebrow">Execution</p><h2>Work orders and issues</h2></div></div><div className="c360RecordList">{records.workOrders.slice(0,8).map(x=><article key={x.id}><ClipboardCheck size={18}/><div><strong>{x.title||'Work order'}</strong><span>{date(x.scheduled_date)} · {x.status}</span></div></article>)}{records.openIssues.slice(0,6).map(x=><article key={x.id}><Wrench size={18}/><div><strong>{x.title}</strong><span>{x.priority||'normal'} · {x.status}</span></div></article>)}{!records.workOrders.length&&!records.issues.length&&<Empty title="No operational records" text="Work orders and facility issues will appear here."/>}</div></section>}

    {tab==='Communications'&&<section className="c360Panel"><div className="c360PanelHead"><div><p className="eyebrow">Relationship</p><h2>Communications</h2></div><button className="btn secondary" onClick={()=>onNavigate('communications')}>Open inbox</button></div><div className="c360Communication"><MessageSquareText size={28}/><strong>Shared customer conversation</strong><p>Open the Communications Center to view and manage this customer’s messages with facility and work-order context.</p></div></section>}

    {tab==='Financial'&&<div className="c360Grid"><section className="c360Panel"><div className="c360PanelHead"><div><p className="eyebrow">Revenue</p><h2>Financial snapshot</h2></div></div><div className="c360Money"><div><span>Monthly recurring value</span><strong>{money(customer.monthly_value)}</strong></div><div><span>Total invoiced</span><strong>{money(records.totalInvoiced)}</strong></div><div><span>Payments received</span><strong>{money(records.totalPaid)}</strong></div><div><span>Outstanding</span><strong>{money(Math.max(0,records.totalInvoiced-records.totalPaid))}</strong></div></div></section><section className="c360Panel c360Wide"><div className="c360PanelHead"><div><p className="eyebrow">Documents</p><h2>Quotes and invoices</h2></div></div><div className="c360RecordList">{[...records.quotes,...records.invoices].slice(0,10).map(x=><article key={x.id}><FileText size={18}/><div><strong>{x.quote_number||x.invoice_number||x.title||'Document'}</strong><span>{x.status}</span></div><b>{money(x.amount)}</b></article>)}{!records.quotes.length&&!records.invoices.length&&<Empty title="No financial records" text="Quotes and invoices will appear here."/>}</div></section></div>}

    {tab==='Documents'&&<section className="c360Panel"><div className="c360PanelHead"><div><p className="eyebrow">Files</p><h2>Customer documents</h2></div></div><Empty title="Document vault ready" text="Contracts, floor plans, insurance, SOPs, and access instructions will be connected in the document phase."/></section>}
    {tab==='Analytics'&&<section className="c360Panel"><div className="c360PanelHead"><div><p className="eyebrow">Performance</p><h2>Customer analytics</h2></div></div><div className="c360Analytics"><div><strong>{records.health}%</strong><span>Health score</span></div><div><strong>{records.inspectionScore?`${records.inspectionScore}%`:'—'}</strong><span>Inspection average</span></div><div><strong>{records.workOrders.length?Math.round(records.workOrders.filter(x=>['verified','completed'].includes(x.status)).length/records.workOrders.length*100):0}%</strong><span>Completion rate</span></div><div><strong>{records.openIssues.length}</strong><span>Open issues</span></div></div></section>}

    <div className="c360Danger"><button onClick={()=>onArchive(customer)}>Archive customer</button></div>
  </div>;
}
