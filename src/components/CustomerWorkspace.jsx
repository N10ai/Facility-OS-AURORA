import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, DollarSign, FileText, Mail, MapPin, Phone, Plus, Search, Trash2, UserRound, X } from 'lucide-react';
import { supabase } from '../services/supabase';

const blankCustomer={name:'',contact_name:'',email:'',phone:'',billing_email:'',address:'',status:'active',customer_type:'commercial',monthly_value:''};
const blankFacility={name:'',address:'',facility_type:'office',status:'active',restroom_count:0,floor_type:'',estimated_minutes:'',access_notes:''};
const money=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(value||0));

export function CustomerWorkspace({open,onClose,startMode='list'}){
  const [profile,setProfile]=useState(null);
  const [customers,setCustomers]=useState([]);
  const [selected,setSelected]=useState(null);
  const [facilities,setFacilities]=useState([]);
  const [quotes,setQuotes]=useState([]);
  const [invoices,setInvoices]=useState([]);
  const [query,setQuery]=useState('');
  const [mode,setMode]=useState(startMode);
  const [customerForm,setCustomerForm]=useState(blankCustomer);
  const [facilityForm,setFacilityForm]=useState(blankFacility);
  const [message,setMessage]=useState('');
  const [loading,setLoading]=useState(false);

  useEffect(()=>{if(open)bootstrap();},[open]);
  useEffect(()=>{if(open&&startMode!=='list')setMode(startMode);},[open,startMode]);

  async function bootstrap(){
    setLoading(true);setMessage('');
    const {data:{session}}=await supabase.auth.getSession();
    if(!session?.user){setMessage('Your session expired. Please log in again.');setLoading(false);return;}
    const {data:p,error}=await supabase.from('profiles').select('*').eq('id',session.user.id).single();
    if(error||!p?.company_id){setMessage(error?.message||'No company workspace found.');setLoading(false);return;}
    setProfile(p);await loadCustomers(p.company_id);setLoading(false);
  }

  async function loadCustomers(companyId=profile?.company_id){
    if(!companyId)return;
    const {data,error}=await supabase.from('customers').select('*').eq('company_id',companyId).order('updated_at',{ascending:false});
    if(error)return setMessage(error.message);
    setCustomers(data||[]);
    if(selected){const fresh=(data||[]).find(x=>x.id===selected.id);if(fresh){setSelected(fresh);await loadCustomerContext(fresh);}else setSelected(null);}
  }

  async function loadCustomerContext(customer){
    const [f,q,i]=await Promise.all([
      supabase.from('facilities').select('*').eq('customer_id',customer.id).order('created_at',{ascending:true}),
      supabase.from('quotes').select('id,quote_number,title,status,total_amount,amount,created_at').eq('customer_id',customer.id).order('created_at',{ascending:false}).limit(6),
      supabase.from('invoices').select('id,invoice_number,status,total_amount,amount,balance_due,due_date').eq('customer_id',customer.id).order('created_at',{ascending:false}).limit(6)
    ]);
    if(f.error||q.error||i.error)setMessage(f.error?.message||q.error?.message||i.error?.message);
    setFacilities(f.data||[]);setQuotes(q.data||[]);setInvoices(i.data||[]);
  }

  async function openCustomer(customer){setSelected(customer);setMode('detail');setMessage('');await loadCustomerContext(customer);}

  async function createCustomer(){
    if(!customerForm.name.trim())return setMessage('Customer name is required.');
    setLoading(true);setMessage('');
    const row={...customerForm,company_id:profile.company_id,monthly_value:Number(customerForm.monthly_value||0),billing_email:customerForm.billing_email||customerForm.email||null};
    const {data,error}=await supabase.from('customers').insert(row).select().single();
    setLoading(false);if(error)return setMessage(error.message);
    setCustomerForm(blankCustomer);await loadCustomers();await openCustomer(data);
  }

  async function updateCustomer(fields){
    if(!selected)return;
    const {data,error}=await supabase.from('customers').update(fields).eq('id',selected.id).select().single();
    if(error)return setMessage(error.message);setSelected(data);await loadCustomers();
  }

  async function deleteCustomer(){
    if(!selected||!window.confirm(`Delete ${selected.name}? Facilities and connected records may prevent deletion.`))return;
    const {error}=await supabase.from('customers').delete().eq('id',selected.id);
    if(error)return setMessage(error.message);setSelected(null);setMode('list');await loadCustomers();
  }

  async function createFacility(){
    if(!selected)return setMessage('Select a customer first.');
    if(!facilityForm.name.trim())return setMessage('Facility name is required.');
    const row={...facilityForm,company_id:profile.company_id,customer_id:selected.id,restroom_count:Number(facilityForm.restroom_count||0),estimated_minutes:facilityForm.estimated_minutes?Number(facilityForm.estimated_minutes):null};
    const {error}=await supabase.from('facilities').insert(row);
    if(error)return setMessage(error.message);setFacilityForm(blankFacility);setMode('detail');await loadCustomerContext(selected);
  }

  const filtered=useMemo(()=>customers.filter(c=>`${c.name} ${c.contact_name||''} ${c.email||''} ${c.address||''}`.toLowerCase().includes(query.trim().toLowerCase())),[customers,query]);
  const active=customers.filter(x=>x.status==='active').length;
  const monthly=customers.reduce((sum,x)=>sum+Number(x.monthly_value||0),0);
  const outstanding=invoices.reduce((sum,x)=>sum+Number(x.balance_due??x.total_amount??x.amount??0),0);

  if(!open)return null;
  return <div className="customerWorkspaceBackdrop"><section className="customerWorkspace">
    <header className="customerWorkspaceHeader"><div><p>CRM</p><h1>Customers & facilities</h1><span>One connected workspace for accounts, locations, sales, and billing.</span></div><button onClick={onClose} aria-label="Close"><X size={21}/></button></header>
    <div className="customerStats"><div><strong>{customers.length}</strong><span>Total customers</span></div><div><strong>{active}</strong><span>Active accounts</span></div><div><strong>{money(monthly)}</strong><span>Monthly value</span></div><div><strong>{selected?money(outstanding):'—'}</strong><span>Selected balance</span></div></div>
    <div className="customerToolbar"><label><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search customers"/></label><button className="customerPrimary" onClick={()=>{setMode('create');setSelected(null)}}><Plus size={17}/> New customer</button></div>
    {message&&<div className="customerNotice">{message}</div>}
    <div className="customerBody">
      <aside className="customerList">{loading&&!customers.length&&<div className="customerEmpty">Loading customers…</div>}{!loading&&!filtered.length&&<div className="customerEmpty">No customers yet.</div>}{filtered.map(c=><button key={c.id} className={selected?.id===c.id?'active':''} onClick={()=>openCustomer(c)}><div className="customerAvatar">{c.name.slice(0,1).toUpperCase()}</div><span><strong>{c.name}</strong><small>{c.contact_name||'No contact'} · {money(c.monthly_value)}/mo</small></span><em>{c.status||'active'}</em></button>)}</aside>
      <main className="customerDetail">
        {mode==='create'&&<CustomerForm form={customerForm} setForm={setCustomerForm} onCancel={()=>setMode('list')} onSave={createCustomer} loading={loading}/>} 
        {mode==='facility'&&selected&&<FacilityForm form={facilityForm} setForm={setFacilityForm} customer={selected} onCancel={()=>setMode('detail')} onSave={createFacility}/>} 
        {mode==='detail'&&selected&&<CustomerDetail customer={selected} facilities={facilities} quotes={quotes} invoices={invoices} onBack={()=>{setSelected(null);setMode('list')}} onUpdate={updateCustomer} onDelete={deleteCustomer} onNewFacility={()=>setMode('facility')}/>} 
        {mode==='list'&&!selected&&<div className="customerWelcome"><Building2 size={36}/><h2>Open a customer</h2><p>Review facilities, revenue, quotes, invoices, contact information, and account status in one place.</p></div>}
      </main>
    </div>
  </section></div>;
}

function CustomerForm({form,setForm,onCancel,onSave,loading}){const set=(k,v)=>setForm({...form,[k]:v});return <div><div className="customerDetailTitle"><button onClick={onCancel}><ArrowLeft size={18}/></button><div><p>New account</p><h2>Create customer</h2></div></div><div className="customerFormGrid"><label>Company name<input value={form.name} onChange={e=>set('name',e.target.value)} autoFocus/></label><label>Primary contact<input value={form.contact_name} onChange={e=>set('contact_name',e.target.value)}/></label><label>Email<input type="email" value={form.email} onChange={e=>set('email',e.target.value)}/></label><label>Phone<input value={form.phone} onChange={e=>set('phone',e.target.value)}/></label><label>Billing email<input type="email" value={form.billing_email} onChange={e=>set('billing_email',e.target.value)}/></label><label>Monthly contract value<input type="number" min="0" value={form.monthly_value} onChange={e=>set('monthly_value',e.target.value)}/></label><label>Status<select value={form.status} onChange={e=>set('status',e.target.value)}><option value="active">Active</option><option value="onboarding">Onboarding</option><option value="inactive">Inactive</option></select></label><label>Type<select value={form.customer_type} onChange={e=>set('customer_type',e.target.value)}><option value="commercial">Commercial</option><option value="residential">Residential</option><option value="government">Government</option></select></label><label className="wide">Billing address<input value={form.address} onChange={e=>set('address',e.target.value)}/></label></div><div className="customerActions"><button onClick={onCancel}>Cancel</button><button className="customerPrimary" disabled={loading} onClick={onSave}>{loading?'Saving…':'Create customer'}</button></div></div>}

function FacilityForm({form,setForm,customer,onCancel,onSave}){const set=(k,v)=>setForm({...form,[k]:v});return <div><div className="customerDetailTitle"><button onClick={onCancel}><ArrowLeft size={18}/></button><div><p>{customer.name}</p><h2>Add facility</h2></div></div><div className="customerFormGrid"><label>Facility name<input value={form.name} onChange={e=>set('name',e.target.value)} autoFocus placeholder="Main office"/></label><label>Facility type<select value={form.facility_type} onChange={e=>set('facility_type',e.target.value)}><option value="office">Office</option><option value="medical">Medical</option><option value="warehouse">Warehouse</option><option value="retail">Retail</option><option value="school">School</option><option value="other">Other</option></select></label><label>Restrooms<input type="number" min="0" value={form.restroom_count} onChange={e=>set('restroom_count',e.target.value)}/></label><label>Estimated service minutes<input type="number" min="0" value={form.estimated_minutes} onChange={e=>set('estimated_minutes',e.target.value)}/></label><label>Floor type<input value={form.floor_type} onChange={e=>set('floor_type',e.target.value)} placeholder="LVT, tile, carpet…"/></label><label>Status<select value={form.status} onChange={e=>set('status',e.target.value)}><option value="active">Active</option><option value="onboarding">Onboarding</option><option value="inactive">Inactive</option></select></label><label className="wide">Service address<input value={form.address} onChange={e=>set('address',e.target.value)}/></label><label className="wide">Access notes<textarea rows="4" value={form.access_notes} onChange={e=>set('access_notes',e.target.value)} placeholder="Keys, alarm, entry instructions…"/></label></div><div className="customerActions"><button onClick={onCancel}>Cancel</button><button className="customerPrimary" onClick={onSave}>Add facility</button></div></div>}

function CustomerDetail({customer,facilities,quotes,invoices,onBack,onUpdate,onDelete,onNewFacility}){return <div><div className="customerDetailTitle"><button onClick={onBack}><ArrowLeft size={18}/></button><div><p>Customer account</p><h2>{customer.name}</h2></div><button className="customerDelete" onClick={onDelete}><Trash2 size={17}/></button></div><div className="customerStatusBar"><button className={customer.status==='onboarding'?'active':''} onClick={()=>onUpdate({status:'onboarding'})}>Onboarding</button><button className={customer.status==='active'?'active':''} onClick={()=>onUpdate({status:'active'})}>Active</button><button className={customer.status==='inactive'?'active':''} onClick={()=>onUpdate({status:'inactive'})}>Inactive</button></div><div className="customerRecordGrid"><Info icon={UserRound} label="Contact" value={customer.contact_name||'Not added'}/><Info icon={Mail} label="Email" value={customer.email||'Not added'}/><Info icon={Phone} label="Phone" value={customer.phone||'Not added'}/><Info icon={DollarSign} label="Monthly value" value={money(customer.monthly_value)}/><Info icon={MapPin} label="Billing address" value={customer.address||'Not added'}/><Info icon={Building2} label="Facilities" value={String(facilities.length)}/></div><section className="customerSection"><div className="customerSectionHead"><div><h3>Facilities</h3><span>Locations serviced for this account.</span></div><button className="customerPrimary" onClick={onNewFacility}><Plus size={16}/> Add facility</button></div><div className="facilityCards">{!facilities.length&&<p className="customerMuted">No facilities added.</p>}{facilities.map(f=><article key={f.id}><div><Building2 size={18}/><strong>{f.name}</strong></div><span>{f.address||'No address'}</span><small>{f.facility_type||'facility'} · {f.restroom_count||0} restrooms · {f.estimated_minutes||'—'} min</small></article>)}</div></section><div className="customerSplit"><Related title="Recent quotes" icon={FileText} rows={quotes} empty="No quotes linked." render={r=><><strong>{r.quote_number||r.title||'Quote'}</strong><span>{r.status} · {money(r.total_amount??r.amount)}</span></>}/><Related title="Recent invoices" icon={DollarSign} rows={invoices} empty="No invoices linked." render={r=><><strong>{r.invoice_number||'Invoice'}</strong><span>{r.status} · {money(r.balance_due??r.total_amount??r.amount)} due</span></>}/></div></div>}
function Info({icon:Icon,label,value}){return <div className="customerInfo"><Icon size={18}/><span><small>{label}</small><strong>{value}</strong></span></div>}
function Related({title,icon:Icon,rows,empty,render}){return <section className="customerSection"><div className="customerSectionHead"><div><h3>{title}</h3></div><Icon size={18}/></div><div className="relatedRows">{!rows.length&&<p className="customerMuted">{empty}</p>}{rows.map(r=><div key={r.id}>{render(r)}</div>)}</div></section>}
