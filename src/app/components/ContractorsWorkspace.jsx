import { useMemo, useState } from 'react';
import { Archive, BadgeCheck, BriefcaseBusiness, Mail, Phone, Plus, Search, ShieldCheck, Wrench, X } from 'lucide-react';
import { archiveRecord, createBusinessRecord, updateRecord } from '../../services/api';
import './ContractorsWorkspace.css';

const blank = {
  business_name:'', contact_name:'', contractor_type:'cleaning', email:'', phone:'', service_area:'Miami-Dade',
  hourly_rate:'', minimum_charge:'', insurance_status:'unknown', insurance_expires_on:'', w9_status:'missing', notes:'', status:'active'
};

export function ContractorsWorkspace({ data, companyId, reload }) {
  const [query,setQuery]=useState('');
  const [type,setType]=useState('all');
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState(blank);
  const [message,setMessage]=useState('');
  const contractors=data.contractors||[];

  const visible=useMemo(()=>contractors.filter(row=>{
    const term=query.trim().toLowerCase();
    const matches=!term||`${row.business_name||''} ${row.contact_name||''} ${row.email||''} ${row.phone||''} ${row.service_area||''}`.toLowerCase().includes(term);
    return matches&&(type==='all'||row.contractor_type===type);
  }),[contractors,query,type]);

  const ready=contractors.filter(row=>row.status==='active'&&row.insurance_status==='verified'&&row.w9_status==='received').length;
  const insuranceDue=contractors.filter(row=>row.insurance_status!=='verified'||(row.insurance_expires_on&&row.insurance_expires_on<=new Date().toISOString().slice(0,10))).length;

  function begin(row=null){setEditing(row);setForm(row?{...blank,...row}:blank);setMessage('');setOpen(true)}
  async function save(){
    if(!form.business_name.trim()) return setMessage('Business name is required.');
    const payload={...form,hourly_rate:Number(form.hourly_rate||0),minimum_charge:Number(form.minimum_charge||0),insurance_expires_on:form.insurance_expires_on||null};
    const result=editing?await updateRecord('contractors',editing.id,payload):await createBusinessRecord('contractors',companyId,payload);
    if(result.error) return setMessage(result.error.message);
    setOpen(false);setEditing(null);setForm(blank);await reload();
  }
  async function archive(row){
    const result=await archiveRecord('contractors',row.id);
    if(result.error) return setMessage(result.error.message);
    await reload();
  }

  return <div className="page contractorsWorkspace">
    <div className="pageHeader"><div><p className="eyebrow">External service network</p><h1>Contractors</h1><p>Manage cleaning partners, plumbers, electricians, handymen, and specialty vendors.</p></div><button className="btn primary" onClick={()=>begin()}><Plus size={17}/> Add contractor</button></div>
    {message&&<div className="notice">{message}</div>}
    <div className="stats">
      <div className="stat"><BriefcaseBusiness size={19}/><strong>{contractors.length}</strong><span>Total partners</span><small>Active and archived network</small></div>
      <div className="stat pastelGreen"><BadgeCheck size={19}/><strong>{ready}</strong><span>Assignment ready</span><small>Insurance and W-9 complete</small></div>
      <div className="stat pastelYellow"><ShieldCheck size={19}/><strong>{insuranceDue}</strong><span>Compliance attention</span><small>Missing or expired documents</small></div>
      <div className="stat"><Wrench size={19}/><strong>{new Set(contractors.map(row=>row.contractor_type)).size}</strong><span>Service categories</span><small>Available specialties</small></div>
    </div>
    <section className="panel contractorToolbar"><label><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search contractors"/></label><select value={type} onChange={e=>setType(e.target.value)}><option value="all">All services</option>{['cleaning','handyman','plumbing','electrical','floor-care','pest-control','hvac','landscaping','other'].map(value=><option key={value} value={value}>{value.replaceAll('-',' ')}</option>)}</select></section>
    <section className="contractorGrid">
      {visible.map(row=><article className="contractorCard" key={row.id}>
        <div className="contractorCardHead"><span className="contractorIcon"><BriefcaseBusiness size={20}/></span><span className={`status ${row.status||'active'}`}>{row.status||'active'}</span></div>
        <h2>{row.business_name}</h2><p>{row.contact_name||'No contact name'} · {(row.contractor_type||'other').replaceAll('-',' ')}</p>
        <div className="contractorDetails">{row.phone&&<span><Phone size={15}/>{row.phone}</span>}{row.email&&<span><Mail size={15}/>{row.email}</span>}<span><Wrench size={15}/>{row.service_area||'Service area not set'}</span></div>
        <div className="contractorCompliance"><span className={row.insurance_status==='verified'?'ok':'warn'}>Insurance: {row.insurance_status||'unknown'}</span><span className={row.w9_status==='received'?'ok':'warn'}>W-9: {row.w9_status||'missing'}</span></div>
        <div className="contractorRates"><strong>${Number(row.hourly_rate||0).toFixed(0)}/hr</strong><span>Minimum ${Number(row.minimum_charge||0).toFixed(0)}</span></div>
        <div className="buttonRow"><button className="btn secondary" onClick={()=>begin(row)}>Edit</button><button className="icon" onClick={()=>archive(row)} title="Archive"><Archive size={17}/></button></div>
      </article>)}
      {!visible.length&&<div className="panel contractorEmpty"><BriefcaseBusiness size={30}/><strong>No contractors found</strong><span>Add your first outsourced service partner.</span></div>}
    </section>
    {open&&<div className="modalBackdrop"><section className="modal contractorModal"><button className="icon close" onClick={()=>setOpen(false)}><X size={18}/></button><p className="eyebrow">{editing?'Edit partner':'New partner'}</p><h2>{editing?'Update contractor':'Add contractor'}</h2>
      <div className="form2"><label>Business name<input value={form.business_name} onChange={e=>setForm({...form,business_name:e.target.value})}/></label><label>Contact name<input value={form.contact_name} onChange={e=>setForm({...form,contact_name:e.target.value})}/></label></div>
      <div className="form2"><label>Service type<select value={form.contractor_type} onChange={e=>setForm({...form,contractor_type:e.target.value})}>{['cleaning','handyman','plumbing','electrical','floor-care','pest-control','hvac','landscaping','other'].map(value=><option key={value} value={value}>{value.replaceAll('-',' ')}</option>)}</select></label><label>Service area<input value={form.service_area} onChange={e=>setForm({...form,service_area:e.target.value})}/></label></div>
      <div className="form2"><label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label></div>
      <div className="form2"><label>Hourly rate<input type="number" value={form.hourly_rate} onChange={e=>setForm({...form,hourly_rate:e.target.value})}/></label><label>Minimum charge<input type="number" value={form.minimum_charge} onChange={e=>setForm({...form,minimum_charge:e.target.value})}/></label></div>
      <div className="form2"><label>Insurance<select value={form.insurance_status} onChange={e=>setForm({...form,insurance_status:e.target.value})}><option value="unknown">Unknown</option><option value="requested">Requested</option><option value="verified">Verified</option><option value="expired">Expired</option></select></label><label>Insurance expires<input type="date" value={form.insurance_expires_on||''} onChange={e=>setForm({...form,insurance_expires_on:e.target.value})}/></label></div>
      <label>W-9 status<select value={form.w9_status} onChange={e=>setForm({...form,w9_status:e.target.value})}><option value="missing">Missing</option><option value="requested">Requested</option><option value="received">Received</option></select></label>
      <label>Notes<textarea value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})}/></label>{message&&<div className="notice">{message}</div>}<div className="buttonRow"><button className="btn secondary" onClick={()=>setOpen(false)}>Cancel</button><button className="btn primary" onClick={save}>{editing?'Save changes':'Add contractor'}</button></div>
    </section></div>}
  </div>;
}