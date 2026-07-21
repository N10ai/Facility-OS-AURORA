import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, CalendarDays, DollarSign, Mail, Phone, Plus, Search, Trash2, UserRound, X } from 'lucide-react';
import { supabase } from '../../services/supabase';

const stages = ['new','contacted','qualified','proposal','won','lost'];
const blankLead = { company_name:'', contact_name:'', email:'', phone:'', address:'', industry:'', facility_type:'office', facility_count:1, opportunity_value:'', source:'', next_follow_up:'', notes:'', stage:'new' };

function money(value){ return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(value||0)); }
function stageLabel(value){ return value.charAt(0).toUpperCase()+value.slice(1); }

export function LeadWorkspace({ open, onClose }) {
  const [profile,setProfile]=useState(null);
  const [leads,setLeads]=useState([]);
  const [selected,setSelected]=useState(null);
  const [form,setForm]=useState(blankLead);
  const [creating,setCreating]=useState(false);
  const [query,setQuery]=useState('');
  const [stage,setStage]=useState('all');
  const [message,setMessage]=useState('');
  const [loading,setLoading]=useState(false);

  useEffect(()=>{ if(open) bootstrap(); },[open]);

  async function bootstrap(){
    setLoading(true); setMessage('');
    const {data:{session}}=await supabase.auth.getSession();
    if(!session?.user){ setMessage('Your session expired. Please log in again.'); setLoading(false); return; }
    const {data:p,error:pError}=await supabase.from('profiles').select('*').eq('id',session.user.id).single();
    if(pError||!p?.company_id){ setMessage(pError?.message||'No company workspace found.'); setLoading(false); return; }
    setProfile(p);
    await loadLeads(p.company_id);
    setLoading(false);
  }

  async function loadLeads(companyId=profile?.company_id){
    if(!companyId) return;
    const {data,error}=await supabase.from('leads').select('*').eq('company_id',companyId).order('updated_at',{ascending:false});
    if(error) return setMessage(error.message);
    setLeads(data||[]);
    if(selected){ const refreshed=(data||[]).find(x=>x.id===selected.id); setSelected(refreshed||null); }
  }

  async function saveLead(){
    if(!form.company_name.trim()) return setMessage('Company name is required.');
    setLoading(true); setMessage('');
    const row={...form,company_id:profile.company_id,created_by:profile.id,facility_count:Number(form.facility_count||1),opportunity_value:Number(form.opportunity_value||0),next_follow_up:form.next_follow_up||null};
    const {data,error}=await supabase.from('leads').insert(row).select().single();
    setLoading(false);
    if(error) return setMessage(error.message);
    setCreating(false); setForm(blankLead); setSelected(data); await loadLeads();
  }

  async function updateLead(fields){
    if(!selected) return;
    const {data,error}=await supabase.from('leads').update(fields).eq('id',selected.id).select().single();
    if(error) return setMessage(error.message);
    setSelected(data); await loadLeads();
  }

  async function removeLead(){
    if(!selected||!window.confirm(`Delete ${selected.company_name}?`)) return;
    const {error}=await supabase.from('leads').delete().eq('id',selected.id);
    if(error) return setMessage(error.message);
    setSelected(null); await loadLeads();
  }

  const filtered=useMemo(()=>leads.filter(lead=>{
    const hay=`${lead.company_name} ${lead.contact_name||''} ${lead.email||''} ${lead.phone||''}`.toLowerCase();
    return (stage==='all'||lead.stage===stage)&&hay.includes(query.trim().toLowerCase());
  }),[leads,query,stage]);

  const pipeline=useMemo(()=>stages.reduce((acc,key)=>{acc[key]=leads.filter(x=>x.stage===key).length;return acc;},{}),[leads]);
  const value=leads.filter(x=>!['won','lost'].includes(x.stage)).reduce((sum,x)=>sum+Number(x.opportunity_value||0),0);

  if(!open) return null;
  return <div className="leadWorkspaceBackdrop">
    <section className="leadWorkspace">
      <header className="leadWorkspaceHeader">
        <div><p>CRM</p><h1>Lead pipeline</h1><span>Capture opportunities, follow up, and move qualified prospects toward a quote.</span></div>
        <button type="button" onClick={onClose} aria-label="Close"><X size={21}/></button>
      </header>

      <div className="leadStats">
        <div><strong>{leads.length}</strong><span>Total leads</span></div>
        <div><strong>{pipeline.qualified||0}</strong><span>Qualified</span></div>
        <div><strong>{pipeline.proposal||0}</strong><span>Proposal</span></div>
        <div><strong>{money(value)}</strong><span>Open pipeline</span></div>
      </div>

      <div className="leadToolbar">
        <label><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search leads"/></label>
        <select value={stage} onChange={e=>setStage(e.target.value)}><option value="all">All stages</option>{stages.map(x=><option value={x} key={x}>{stageLabel(x)}</option>)}</select>
        <button className="leadPrimary" onClick={()=>{setCreating(true);setSelected(null);setMessage('')}}><Plus size={17}/> New lead</button>
      </div>

      {message&&<div className="leadNotice">{message}</div>}

      <div className="leadBody">
        <aside className="leadList">
          {loading&&!leads.length&&<div className="leadEmpty">Loading leads…</div>}
          {!loading&&!filtered.length&&<div className="leadEmpty">No leads match this view.</div>}
          {filtered.map(lead=><button key={lead.id} className={selected?.id===lead.id?'active':''} onClick={()=>{setSelected(lead);setCreating(false);setMessage('')}}>
            <div className="leadAvatar">{lead.company_name.slice(0,1).toUpperCase()}</div>
            <span><strong>{lead.company_name}</strong><small>{lead.contact_name||'No contact'} · {money(lead.opportunity_value)}</small></span>
            <em className={`leadStage ${lead.stage}`}>{stageLabel(lead.stage)}</em>
          </button>)}
        </aside>

        <main className="leadDetail">
          {creating&&<LeadForm form={form} setForm={setForm} onCancel={()=>setCreating(false)} onSave={saveLead} loading={loading}/>} 
          {!creating&&selected&&<LeadDetail lead={selected} onBack={()=>setSelected(null)} onUpdate={updateLead} onDelete={removeLead}/>} 
          {!creating&&!selected&&<div className="leadWelcome"><Building2 size={34}/><h2>Select a lead</h2><p>Open a prospect to review contact information, value, follow-up date, and pipeline stage.</p></div>}
        </main>
      </div>
    </section>
  </div>;
}

function LeadForm({form,setForm,onCancel,onSave,loading}){
  const field=(key,value)=>setForm({...form,[key]:value});
  return <div className="leadForm"><div className="leadDetailTitle"><button onClick={onCancel}><ArrowLeft size={18}/></button><div><p>New opportunity</p><h2>Create lead</h2></div></div>
    <div className="leadFormGrid">
      <label>Company name<input value={form.company_name} onChange={e=>field('company_name',e.target.value)} autoFocus/></label>
      <label>Contact name<input value={form.contact_name} onChange={e=>field('contact_name',e.target.value)}/></label>
      <label>Email<input type="email" value={form.email} onChange={e=>field('email',e.target.value)}/></label>
      <label>Phone<input value={form.phone} onChange={e=>field('phone',e.target.value)}/></label>
      <label>Industry<input value={form.industry} onChange={e=>field('industry',e.target.value)} placeholder="Medical, office, warehouse…"/></label>
      <label>Facility type<select value={form.facility_type} onChange={e=>field('facility_type',e.target.value)}><option>office</option><option>medical</option><option>warehouse</option><option>retail</option><option>school</option><option>other</option></select></label>
      <label>Facility count<input type="number" min="1" value={form.facility_count} onChange={e=>field('facility_count',e.target.value)}/></label>
      <label>Estimated monthly value<input type="number" min="0" value={form.opportunity_value} onChange={e=>field('opportunity_value',e.target.value)}/></label>
      <label>Source<input value={form.source} onChange={e=>field('source',e.target.value)} placeholder="Referral, website, outbound…"/></label>
      <label>Next follow-up<input type="date" value={form.next_follow_up} onChange={e=>field('next_follow_up',e.target.value)}/></label>
      <label className="wide">Address<input value={form.address} onChange={e=>field('address',e.target.value)}/></label>
      <label className="wide">Notes<textarea value={form.notes} onChange={e=>field('notes',e.target.value)} rows="4"/></label>
    </div>
    <div className="leadActions"><button onClick={onCancel}>Cancel</button><button className="leadPrimary" disabled={loading} onClick={onSave}>{loading?'Saving…':'Create lead'}</button></div>
  </div>;
}

function LeadDetail({lead,onBack,onUpdate,onDelete}){
  return <div className="leadRecord"><div className="leadDetailTitle"><button onClick={onBack}><ArrowLeft size={18}/></button><div><p>Opportunity</p><h2>{lead.company_name}</h2></div><button className="leadDelete" onClick={onDelete}><Trash2 size={17}/></button></div>
    <div className="leadStageBar">{stages.map(stage=><button key={stage} className={lead.stage===stage?'active':''} onClick={()=>onUpdate({stage})}>{stageLabel(stage)}</button>)}</div>
    <div className="leadRecordGrid">
      <Info icon={UserRound} label="Contact" value={lead.contact_name||'Not added'}/>
      <Info icon={Mail} label="Email" value={lead.email||'Not added'}/>
      <Info icon={Phone} label="Phone" value={lead.phone||'Not added'}/>
      <Info icon={DollarSign} label="Monthly value" value={money(lead.opportunity_value)}/>
      <Info icon={Building2} label="Facilities" value={`${lead.facility_count||1} · ${lead.facility_type||'office'}`}/>
      <Info icon={CalendarDays} label="Next follow-up" value={lead.next_follow_up||'Not scheduled'}/>
    </div>
    <section className="leadNotes"><div><h3>Notes</h3><span>Update the working context for this opportunity.</span></div><textarea defaultValue={lead.notes||''} onBlur={e=>{if(e.target.value!==lead.notes)onUpdate({notes:e.target.value})}} rows="7"/></section>
  </div>;
}

function Info({icon:Icon,label,value}){return <div className="leadInfo"><Icon size={18}/><span><small>{label}</small><strong>{value}</strong></span></div>}
