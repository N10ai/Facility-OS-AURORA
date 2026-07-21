import { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, Check, Copy, Edit3, FileText, Plus, Printer, Trash2, UserPlus, X } from 'lucide-react';
import { supabase } from '../../services/supabase';
import './SalesWorkspace.css';

const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n||0));
const leadBlank={company_name:'',contact_name:'',email:'',phone:'',facility_type:'office',address:'',source:'referral',stage:'new',opportunity_value:0,next_follow_up:'',notes:''};
const quoteBlank={id:null,lead_id:'',customer_id:'',facility_id:'',quote_number:'',title:'Recurring Commercial Cleaning',frequency:'weekly',valid_until:'',discount_amount:0,tax_rate:0,scope_of_work:'',exclusions:'',payment_terms:'Net 15',customer_facing_notes:'',notes:'',status:'draft',lines:[{description:'Recurring cleaning service',quantity:1,unit:'visit',unit_price:0,is_optional:false,is_selected:true}]};

export function SalesWorkspace({open,onClose}){
  const [tab,setTab]=useState('leads');
  const [profile,setProfile]=useState(null);
  const [leads,setLeads]=useState([]); const [quotes,setQuotes]=useState([]); const [customers,setCustomers]=useState([]); const [facilities,setFacilities]=useState([]);
  const [leadForm,setLeadForm]=useState(null); const [quoteForm,setQuoteForm]=useState(null); const [preview,setPreview]=useState(null); const [message,setMessage]=useState('');

  async function load(){
    const {data:{user}}=await supabase.auth.getUser(); if(!user)return;
    const {data:p}=await supabase.from('profiles').select('id,company_id,role').eq('id',user.id).single(); if(!p)return;
    setProfile(p);
    const [{data:l},{data:q},{data:c},{data:f},{data:li}]=await Promise.all([
      supabase.from('leads').select('*').eq('company_id',p.company_id).order('created_at',{ascending:false}),
      supabase.from('quotes').select('*').eq('company_id',p.company_id).order('created_at',{ascending:false}),
      supabase.from('customers').select('id,name').eq('company_id',p.company_id).order('name'),
      supabase.from('facilities').select('id,name,customer_id').eq('company_id',p.company_id).order('name'),
      supabase.from('quote_line_items').select('*').eq('company_id',p.company_id).order('sort_order')
    ]);
    setLeads(l||[]); setCustomers(c||[]); setFacilities(f||[]);
    setQuotes((q||[]).map(x=>({...x,lines:(li||[]).filter(i=>i.quote_id===x.id)})));
  }
  useEffect(()=>{if(open)load()},[open]);
  const canSell=['owner','admin','manager','sales_rep','account_manager'].includes(profile?.role);

  async function saveLead(){
    if(!leadForm.company_name)return setMessage('Lead company name is required.');
    const payload={...leadForm,company_id:profile.company_id,assigned_to:profile.id,opportunity_value:Number(leadForm.opportunity_value||0),next_follow_up:leadForm.next_follow_up||null,updated_at:new Date().toISOString()};
    const query=leadForm.id?supabase.from('leads').update(payload).eq('id',leadForm.id):supabase.from('leads').insert(payload);
    const {error}=await query; if(error)return setMessage(error.message); setLeadForm(null);setMessage('Lead saved.');await load();
  }
  async function deleteLead(id){if(!confirm('Delete this lead?'))return;const{error}=await supabase.from('leads').delete().eq('id',id);if(error)return setMessage(error.message);await load()}
  async function convertLead(lead){
    const {data:customer,error}=await supabase.from('customers').insert({company_id:profile.company_id,name:lead.company_name,status:'active'}).select().single();
    if(error)return setMessage(error.message);
    if(lead.contact_name)await supabase.from('customer_contacts').insert({company_id:profile.company_id,customer_id:customer.id,full_name:lead.contact_name,email:lead.email||null,phone:lead.phone||null,status:'active'});
    if(lead.address)await supabase.from('facilities').insert({company_id:profile.company_id,customer_id:customer.id,name:lead.company_name,address_line1:lead.address,status:'active'});
    await supabase.from('leads').update({stage:'won',converted_customer_id:customer.id,updated_at:new Date().toISOString()}).eq('id',lead.id);
    setMessage('Lead converted to customer.');await load();
  }

  function quoteTotals(form){const subtotal=form.lines.filter(l=>!l.is_optional||l.is_selected).reduce((s,l)=>s+Number(l.quantity||0)*Number(l.unit_price||0),0);const discount=Number(form.discount_amount||0);const tax=(subtotal-discount)*Number(form.tax_rate||0)/100;return{subtotal,tax,total:Math.max(0,subtotal-discount+tax)}}
  function addLine(){setQuoteForm(f=>({...f,lines:[...f.lines,{description:'',quantity:1,unit:'service',unit_price:0,is_optional:false,is_selected:true}]}))}
  function setLine(i,key,value){setQuoteForm(f=>({...f,lines:f.lines.map((l,n)=>n===i?{...l,[key]:value}:l)}))}
  function removeLine(i){setQuoteForm(f=>({...f,lines:f.lines.filter((_,n)=>n!==i)}))}
  async function saveQuote(){
    if(!quoteForm.title||!quoteForm.lines.length)return setMessage('Add a title and at least one line item.');
    const totals=quoteTotals(quoteForm); const q={...quoteForm}; delete q.lines; delete q.id;
    const payload={...q,company_id:profile.company_id,lead_id:q.lead_id||null,customer_id:q.customer_id||null,facility_id:q.facility_id||null,quote_number:q.quote_number||`Q-${Date.now().toString().slice(-6)}`,discount_amount:Number(q.discount_amount||0),tax_rate:Number(q.tax_rate||0),subtotal:totals.subtotal,tax_amount:totals.tax,total_amount:totals.total,amount:totals.total,updated_at:new Date().toISOString()};
    let quote;
    if(quoteForm.id){const{data,error}=await supabase.from('quotes').update(payload).eq('id',quoteForm.id).select().single();if(error)return setMessage(error.message);quote=data;await supabase.from('quote_line_items').delete().eq('quote_id',quote.id)}
    else{const{data,error}=await supabase.from('quotes').insert(payload).select().single();if(error)return setMessage(error.message);quote=data}
    const lines=quoteForm.lines.map((l,i)=>({company_id:profile.company_id,quote_id:quote.id,description:l.description,quantity:Number(l.quantity||0),unit:l.unit||'service',unit_price:Number(l.unit_price||0),is_optional:!!l.is_optional,is_selected:l.is_selected!==false,sort_order:i}));
    const{error:lineError}=await supabase.from('quote_line_items').insert(lines);if(lineError)return setMessage(lineError.message);
    setQuoteForm(null);setMessage('Quote saved.');await load();
  }
  async function deleteQuote(id){if(!confirm('Delete this quote and all line items?'))return;const{error}=await supabase.from('quotes').delete().eq('id',id);if(error)return setMessage(error.message);await load()}
  function editQuote(q){setQuoteForm({...quoteBlank,...q,lines:q.lines?.length?q.lines:quoteBlank.lines})}
  async function duplicateQuote(q){const copy={...q,id:null,quote_number:'',title:`${q.title} — Copy`,status:'draft',lines:q.lines.map(l=>({...l,id:undefined,quote_id:undefined}))};setQuoteForm(copy)}
  async function setStatus(id,status){const{error}=await supabase.from('quotes').update({status,updated_at:new Date().toISOString()}).eq('id',id);if(error)return setMessage(error.message);await load()}

  if(!open)return null;
  return <div className="salesBackdrop"><div className="salesShell"><header><div><strong>Sales & Quotes</strong><span>Lead → estimate → professional proposal → customer</span></div><button onClick={onClose}><X/></button></header>
    {!canSell?<div className="salesNotice">Your role does not have access to sales records.</div>:<>
    <div className="salesTabs"><button className={tab==='leads'?'active':''} onClick={()=>setTab('leads')}><UserPlus size={17}/> Leads</button><button className={tab==='quotes'?'active':''} onClick={()=>setTab('quotes')}><FileText size={17}/> Quotes</button></div>
    {message&&<div className="salesNotice">{message}</div>}
    {tab==='leads'&&<main><div className="salesToolbar"><div><h1>Lead pipeline</h1><p>Add prospects before they become customers.</p></div><button className="primary" onClick={()=>setLeadForm({...leadBlank})}><Plus/> New lead</button></div><div className="leadGrid">{leads.map(l=><article key={l.id}><div className="row"><span className={`stage ${l.stage}`}>{l.stage.replaceAll('_',' ')}</span><strong>{money(l.opportunity_value)}</strong></div><h2>{l.company_name}</h2><p>{l.contact_name||'No contact'} · {l.email||l.phone||'No contact details'}</p><small>Next follow-up: {l.next_follow_up||'not scheduled'}</small><div className="actions"><button onClick={()=>setLeadForm({...l})}><Edit3/> Edit</button><button onClick={()=>convertLead(l)}><Check/> Convert</button><button className="danger" onClick={()=>deleteLead(l.id)}><Trash2/></button></div></article>)}</div></main>}
    {tab==='quotes'&&<main><div className="salesToolbar"><div><h1>Professional quotes</h1><p>Build editable proposals with line items and terms.</p></div><button className="primary" onClick={()=>setQuoteForm({...quoteBlank,quote_number:`Q-${Date.now().toString().slice(-6)}`})}><Plus/> New quote</button></div><div className="quoteList">{quotes.map(q=><article key={q.id}><div><span className={`stage ${q.status}`}>{q.status}</span><small>{q.quote_number}</small><h2>{q.title}</h2><p>{customers.find(c=>c.id===q.customer_id)?.name||leads.find(l=>l.id===q.lead_id)?.company_name||'Prospect'}</p></div><strong>{money(q.total_amount||q.amount)}</strong><div className="actions"><button onClick={()=>setPreview(q)}><Printer/> Preview</button><button onClick={()=>editQuote(q)}><Edit3/> Edit</button><button onClick={()=>duplicateQuote(q)}><Copy/> Duplicate</button><button onClick={()=>setStatus(q.id,'sent')}>Send</button><button onClick={()=>setStatus(q.id,'accepted')}>Accept</button><button className="danger" onClick={()=>deleteQuote(q.id)}><Trash2/></button></div></article>)}</div></main>}
    </>}
  </div>
  {leadForm&&<div className="salesModal"><section><button className="close" onClick={()=>setLeadForm(null)}><X/></button><h2>{leadForm.id?'Edit lead':'New lead'}</h2><div className="formGrid"><label>Company<input value={leadForm.company_name} onChange={e=>setLeadForm({...leadForm,company_name:e.target.value})}/></label><label>Contact<input value={leadForm.contact_name||''} onChange={e=>setLeadForm({...leadForm,contact_name:e.target.value})}/></label><label>Email<input value={leadForm.email||''} onChange={e=>setLeadForm({...leadForm,email:e.target.value})}/></label><label>Phone<input value={leadForm.phone||''} onChange={e=>setLeadForm({...leadForm,phone:e.target.value})}/></label><label>Stage<select value={leadForm.stage} onChange={e=>setLeadForm({...leadForm,stage:e.target.value})}>{['new','contacted','walkthrough_scheduled','estimating','quote_sent','won','lost'].map(x=><option key={x}>{x}</option>)}</select></label><label>Opportunity value<input type="number" value={leadForm.opportunity_value} onChange={e=>setLeadForm({...leadForm,opportunity_value:e.target.value})}/></label><label>Next follow-up<input type="date" value={leadForm.next_follow_up||''} onChange={e=>setLeadForm({...leadForm,next_follow_up:e.target.value})}/></label><label>Address<input value={leadForm.address||''} onChange={e=>setLeadForm({...leadForm,address:e.target.value})}/></label></div><label>Notes<textarea value={leadForm.notes||''} onChange={e=>setLeadForm({...leadForm,notes:e.target.value})}/></label><button className="primary full" onClick={saveLead}>Save lead</button></section></div>}
  {quoteForm&&<div className="salesModal"><section className="quoteEditor"><button className="close" onClick={()=>setQuoteForm(null)}><X/></button><h2>{quoteForm.id?'Edit quote':'New quote'}</h2><div className="formGrid"><label>Lead<select value={quoteForm.lead_id||''} onChange={e=>setQuoteForm({...quoteForm,lead_id:e.target.value})}><option value="">None</option>{leads.map(l=><option key={l.id} value={l.id}>{l.company_name}</option>)}</select></label><label>Customer<select value={quoteForm.customer_id||''} onChange={e=>setQuoteForm({...quoteForm,customer_id:e.target.value,facility_id:''})}><option value="">Prospect</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Quote #<input value={quoteForm.quote_number||''} onChange={e=>setQuoteForm({...quoteForm,quote_number:e.target.value})}/></label><label>Valid until<input type="date" value={quoteForm.valid_until||''} onChange={e=>setQuoteForm({...quoteForm,valid_until:e.target.value})}/></label></div><label>Title<input value={quoteForm.title} onChange={e=>setQuoteForm({...quoteForm,title:e.target.value})}/></label><div className="lineHead"><h3>Line items</h3><button onClick={addLine}><Plus/> Add item</button></div>{quoteForm.lines.map((l,i)=><div className="lineItem" key={i}><input className="desc" placeholder="Service description" value={l.description} onChange={e=>setLine(i,'description',e.target.value)}/><input type="number" value={l.quantity} onChange={e=>setLine(i,'quantity',e.target.value)}/><input value={l.unit} onChange={e=>setLine(i,'unit',e.target.value)}/><input type="number" step="0.01" value={l.unit_price} onChange={e=>setLine(i,'unit_price',e.target.value)}/><strong>{money(Number(l.quantity)*Number(l.unit_price))}</strong><button onClick={()=>removeLine(i)}><Trash2/></button></div>)}<div className="formGrid"><label>Discount<input type="number" value={quoteForm.discount_amount} onChange={e=>setQuoteForm({...quoteForm,discount_amount:e.target.value})}/></label><label>Tax %<input type="number" step="0.01" value={quoteForm.tax_rate} onChange={e=>setQuoteForm({...quoteForm,tax_rate:e.target.value})}/></label></div><label>Scope of work<textarea value={quoteForm.scope_of_work||''} onChange={e=>setQuoteForm({...quoteForm,scope_of_work:e.target.value})}/></label><label>Exclusions<textarea value={quoteForm.exclusions||''} onChange={e=>setQuoteForm({...quoteForm,exclusions:e.target.value})}/></label><label>Payment terms<input value={quoteForm.payment_terms||''} onChange={e=>setQuoteForm({...quoteForm,payment_terms:e.target.value})}/></label><div className="quoteTotal"><span>Total</span><strong>{money(quoteTotals(quoteForm).total)}</strong></div><button className="primary full" onClick={saveQuote}>Save professional quote</button></section></div>}
  {preview&&<div className="salesModal"><section className="proposal"><button className="close" onClick={()=>setPreview(null)}><X/></button><div className="proposalBrand"><div><strong>FacilityOS Cleaning Services</strong><span>Professional service proposal</span></div><b>{preview.quote_number}</b></div><h1>{preview.title}</h1><p>Prepared for {customers.find(c=>c.id===preview.customer_id)?.name||leads.find(l=>l.id===preview.lead_id)?.company_name||'Prospective Customer'}</p><table><tbody>{preview.lines.map(l=><tr key={l.id}><td>{l.description}<small>{l.quantity} {l.unit} × {money(l.unit_price)}</small></td><td>{money(l.line_total||l.quantity*l.unit_price)}</td></tr>)}</tbody></table><div className="proposalTotal"><span>Total investment</span><strong>{money(preview.total_amount||preview.amount)}</strong></div>{preview.scope_of_work&&<><h3>Scope of work</h3><p>{preview.scope_of_work}</p></>}{preview.exclusions&&<><h3>Exclusions</h3><p>{preview.exclusions}</p></>}{preview.payment_terms&&<><h3>Payment terms</h3><p>{preview.payment_terms}</p></>}<button className="primary full" onClick={()=>window.print()}><Printer/> Print / Save PDF</button></section></div>}
  </div>
}