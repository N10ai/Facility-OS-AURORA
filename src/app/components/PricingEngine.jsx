import { useEffect, useMemo, useState } from 'react';
import { Calculator, Check, ChevronLeft, ChevronRight, FileText, Minus, Plus, Save, Sparkles, X } from 'lucide-react';
import { supabase } from '../../services/supabase';
import './PricingEngine.css';

const TYPES={office:1,medical:1.28,warehouse:0.82,retail:1.12,school:1.18,church:.92,gym:1.3,restaurant:1.42,other:1};
const SIZE={small:{sqft:1500,label:'Small'},medium:{sqft:4000,label:'Medium'},large:{sqft:10000,label:'Large'},xlarge:{sqft:20000,label:'Very large'}};
const FLOOR={carpet:1.05,lvt:1.12,tile:1.18,concrete:.82,mixed:1.1};
const CONDITION={maintained:.88,average:1,dirty:1.28};
const FREQUENCY={daily:{visits:21,discount:.82,label:'Daily'},three:{visits:13,discount:.88,label:'3× / week'},weekly:{visits:4.33,discount:1,label:'Weekly'},biweekly:{visits:2.17,discount:1.08,label:'Every 2 weeks'},monthly:{visits:1,discount:1.18,label:'Monthly'}};
const INITIAL={type:'office',size:'medium',sqft:'',employees:12,desks:10,restrooms:2,kitchens:1,conference:1,warehouse:'none',floor:'mixed',frequency:'weekly',condition:'average',customer_id:'',facility_id:'',prospect_name:'',notes:''};

const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n||0);
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));

function Counter({label,value,onChange}){
  return <div className="peCounter"><span>{label}</span><div><button type="button" onClick={()=>onChange(Math.max(0,value-1))}><Minus size={16}/></button><strong>{value}</strong><button type="button" onClick={()=>onChange(value+1)}><Plus size={16}/></button></div></div>;
}

export function PricingEngine({open,onClose}){
  const [step,setStep]=useState(0);
  const [form,setForm]=useState(INITIAL);
  const [profile,setProfile]=useState(null);
  const [customers,setCustomers]=useState([]);
  const [facilities,setFacilities]=useState([]);
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [savedEstimate,setSavedEstimate]=useState(null);
  const set=(key,value)=>setForm(current=>({...current,[key]:value,...(key==='customer_id'?{facility_id:''}:{})}));

  useEffect(()=>{
    if(!open||!supabase)return;
    let active=true;
    (async()=>{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user)return;
      const {data:p}=await supabase.from('profiles').select('id,company_id').eq('id',user.id).maybeSingle();
      if(!active||!p)return;
      setProfile(p);
      const [{data:c},{data:f}]=await Promise.all([
        supabase.from('customers').select('id,name').eq('company_id',p.company_id).order('name'),
        supabase.from('facilities').select('id,name,customer_id').eq('company_id',p.company_id).order('name')
      ]);
      if(active){setCustomers(c||[]);setFacilities(f||[])}
    })();
    return()=>{active=false};
  },[open]);

  const result=useMemo(()=>{
    const sqft=Number(form.sqft)||SIZE[form.size].sqft;
    const baseMinutes=sqft/52;
    const objectMinutes=form.desks*1.35+form.restrooms*17+form.kitchens*18+form.conference*8+form.employees*.35;
    const warehouseMinutes=form.warehouse==='large'?55:form.warehouse==='small'?22:0;
    const minutes=(baseMinutes+objectMinutes+warehouseMinutes)*TYPES[form.type]*FLOOR[form.floor]*CONDITION[form.condition];
    const hours=Math.max(1,minutes/60);
    const crew=hours>5?2:1;
    const laborCost=hours*25*1.18;
    const supplyCost=Math.max(5,sqft*.0025+form.restrooms*2.2+form.kitchens*1.75);
    const overhead=18+laborCost*.14;
    const cost=laborCost+supplyCost+overhead;
    const targetPerVisit=Math.max(85,cost/.55)*FREQUENCY[form.frequency].discount;
    const recommended=Math.ceil(targetPerVisit/5)*5;
    const minimum=Math.ceil((cost/.68)/5)*5;
    const premium=Math.ceil((recommended*1.18)/5)*5;
    const monthly=recommended*FREQUENCY[form.frequency].visits;
    const margin=(recommended-cost)/recommended*100;
    let confidence=72;
    if(form.sqft)confidence+=10;
    if(form.desks||form.restrooms)confidence+=7;
    if(form.condition!=='average')confidence+=3;
    confidence=clamp(confidence,55,94);
    return {sqft,hours,crew,supplyCost,cost,recommended,minimum,premium,monthly,margin,confidence};
  },[form]);

  const payload=()=>({
    company_id:profile.company_id,customer_id:form.customer_id||null,facility_id:form.facility_id||null,created_by:profile.id,
    prospect_name:form.prospect_name||null,facility_type:form.type,size_band:form.size,approximate_sqft:result.sqft,
    employees:form.employees,desks:form.desks,restrooms:form.restrooms,kitchens:form.kitchens,conference_rooms:form.conference,
    warehouse_size:form.warehouse,floor_type:form.floor,service_frequency:form.frequency,current_condition:form.condition,
    estimated_hours:Number(result.hours.toFixed(2)),suggested_crew:result.crew,estimated_supply_cost:Number(result.supplyCost.toFixed(2)),
    estimated_cost:Number(result.cost.toFixed(2)),minimum_price:result.minimum,recommended_price:result.recommended,premium_price:result.premium,
    estimated_monthly_revenue:Number(result.monthly.toFixed(2)),estimated_margin:Number(result.margin.toFixed(2)),confidence_score:result.confidence,notes:form.notes||null
  });

  async function saveEstimate(){
    if(!profile)return setMessage('Your workspace is still loading. Try again in a moment.');
    setBusy(true);setMessage('');
    const query=savedEstimate
      ? supabase.from('pricing_estimates').update(payload()).eq('id',savedEstimate.id).select().single()
      : supabase.from('pricing_estimates').insert(payload()).select().single();
    const {data,error}=await query;
    setBusy(false);
    if(error)return setMessage(error.message.includes('pricing_estimates')?'Deploy the new pricing-estimates migration in Supabase, then try again.':error.message);
    setSavedEstimate(data);setMessage('Estimate saved. You can return to it or convert it into a quote.');
    return data;
  }

  async function createQuoteFromEstimate(){
    if(!profile)return setMessage('Your workspace is still loading. Try again in a moment.');
    setBusy(true);setMessage('');
    let estimate=savedEstimate;
    if(!estimate){
      const {data,error}=await supabase.from('pricing_estimates').insert(payload()).select().single();
      if(error){setBusy(false);return setMessage(error.message.includes('pricing_estimates')?'Deploy the new pricing-estimates migration in Supabase, then try again.':error.message)}
      estimate=data;setSavedEstimate(data);
    }
    const customer=customers.find(x=>x.id===form.customer_id);
    const facility=facilities.find(x=>x.id===form.facility_id);
    const title=`Recurring cleaning — ${facility?.name||customer?.name||form.prospect_name||form.type}`;
    const notes=[
      `Generated from Pricing Intelligence estimate ${estimate.id}.`,
      `${FREQUENCY[form.frequency].label} service at ${money(result.recommended)} per visit (${money(result.monthly)} estimated monthly).`,
      `${result.hours.toFixed(1)} estimated labor hours, ${result.crew} cleaner${result.crew===1?'':'s'}, ${result.confidence}% confidence.`,
      form.notes
    ].filter(Boolean).join('\n');
    const quoteNumber=`Q-${Date.now().toString().slice(-6)}`;
    const {data:quote,error}=await supabase.from('quotes').insert({company_id:profile.company_id,customer_id:form.customer_id||null,facility_id:form.facility_id||null,quote_number:quoteNumber,title,amount:Number(result.monthly.toFixed(2)),status:'draft',notes}).select().single();
    if(error){setBusy(false);return setMessage(error.message)}
    await supabase.from('pricing_estimates').update({quote_id:quote.id,status:'quoted',updated_at:new Date().toISOString()}).eq('id',estimate.id);
    setSavedEstimate({...estimate,quote_id:quote.id,status:'quoted'});setBusy(false);setMessage(`Quote ${quoteNumber} created as a draft for ${money(result.monthly)} per month.`);
  }

  function reset(){setStep(0);setForm(INITIAL);setSavedEstimate(null);setMessage('')}

  if(!open)return null;
  const availableFacilities=facilities.filter(f=>!form.customer_id||f.customer_id===form.customer_id);
  const screens=[
    <section><p className="peEyebrow">Step 1 of 5</p><h2>What are you cleaning?</h2><p>Choose the closest facility type.</p><div className="peChoices peGrid">{Object.keys(TYPES).map(type=><button type="button" key={type} className={form.type===type?'active':''} onClick={()=>set('type',type)}>{type[0].toUpperCase()+type.slice(1)}</button>)}</div></section>,
    <section><p className="peEyebrow">Step 2 of 5</p><h2>About how big is it?</h2><p>No measuring required. Choose a range or enter approximate square feet.</p><div className="peChoices">{Object.entries(SIZE).map(([key,item])=><button type="button" key={key} className={form.size===key?'active':''} onClick={()=>set('size',key)}><strong>{item.label}</strong><span>≈ {item.sqft.toLocaleString()} sq ft</span></button>)}</div><label className="peField">Approximate square feet <span>(optional)</span><input type="number" placeholder="Example: 3500" value={form.sqft} onChange={e=>set('sqft',e.target.value)}/></label></section>,
    <section><p className="peEyebrow">Step 3 of 5</p><h2>What does it have?</h2><p>Only count the obvious items. A rough number is enough.</p><div className="peCounters"><Counter label="Employees" value={form.employees} onChange={v=>set('employees',v)}/><Counter label="Desks" value={form.desks} onChange={v=>set('desks',v)}/><Counter label="Restrooms" value={form.restrooms} onChange={v=>set('restrooms',v)}/><Counter label="Kitchens / break rooms" value={form.kitchens} onChange={v=>set('kitchens',v)}/><Counter label="Conference rooms" value={form.conference} onChange={v=>set('conference',v)}/></div><div className="peSegment"><span>Warehouse area</span>{['none','small','large'].map(v=><button type="button" key={v} className={form.warehouse===v?'active':''} onClick={()=>set('warehouse',v)}>{v}</button>)}</div></section>,
    <section><p className="peEyebrow">Step 4 of 5</p><h2>Floor and condition</h2><p>Choose what covers most of the cleanable space.</p><div className="peChoices peGrid">{Object.keys(FLOOR).map(v=><button type="button" key={v} className={form.floor===v?'active':''} onClick={()=>set('floor',v)}>{v.toUpperCase()}</button>)}</div><h3>Current condition</h3><div className="peChoices">{[['maintained','Well maintained'],['average','Average'],['dirty','Needs deep cleaning']].map(([v,label])=><button type="button" key={v} className={form.condition===v?'active':''} onClick={()=>set('condition',v)}>{label}</button>)}</div></section>,
    <section><p className="peEyebrow">Step 5 of 5</p><h2>How often?</h2><p>Recurring frequency changes setup efficiency and the monthly value.</p><div className="peChoices">{Object.entries(FREQUENCY).map(([v,item])=><button type="button" key={v} className={form.frequency===v?'active':''} onClick={()=>set('frequency',v)}>{item.label}</button>)}</div></section>,
    <section className="peResult"><div className="peResultTop"><div><p className="peEyebrow"><Sparkles size={14}/> Smart recommendation</p><h2>{money(result.recommended)} <span>/ visit</span></h2><p>{money(result.monthly)} estimated monthly revenue</p></div><div className="peConfidence"><strong>{result.confidence}%</strong><span>confidence</span></div></div><div className="pePriceBand"><div><span>Minimum</span><strong>{money(result.minimum)}</strong></div><div className="featured"><span>Recommended</span><strong>{money(result.recommended)}</strong></div><div><span>Premium</span><strong>{money(result.premium)}</strong></div></div><div className="peFacts"><div><span>Estimated labor</span><strong>{result.hours.toFixed(1)} hr</strong></div><div><span>Suggested crew</span><strong>{result.crew}</strong></div><div><span>Supplies</span><strong>{money(result.supplyCost)}</strong></div><div><span>Gross margin</span><strong>{Math.round(result.margin)}%</strong></div></div><div className="peExplain">Based on an approximately {result.sqft.toLocaleString()} sq ft {form.type} with {form.restrooms} restroom{form.restrooms===1?'':'s'}, {form.desks} desks, {form.floor.toUpperCase()} flooring and {FREQUENCY[form.frequency].label.toLowerCase()} service.</div><div className="peLinkFields"><label>Customer<select value={form.customer_id} onChange={e=>set('customer_id',e.target.value)}><option value="">Prospect / not selected</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Facility<select value={form.facility_id} onChange={e=>set('facility_id',e.target.value)}><option value="">Optional</option>{availableFacilities.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label><label>Prospect or estimate name<input value={form.prospect_name} placeholder="Example: ABC Medical" onChange={e=>set('prospect_name',e.target.value)}/></label><label>Notes<textarea value={form.notes} placeholder="Scope assumptions, access, special services..." onChange={e=>set('notes',e.target.value)}/></label></div>{message&&<div className={`peMessage ${message.includes('created')||message.includes('saved')?'success':''}`}>{message.includes('created')||message.includes('saved')?<Check size={17}/>:null}{message}</div>}<div className="peResultActions"><button type="button" className="peSecondary" onClick={reset}>Start over</button><button type="button" className="peSecondary" disabled={busy} onClick={saveEstimate}><Save size={17}/>{savedEstimate?'Update estimate':'Save estimate'}</button><button type="button" className="pePrimary" disabled={busy} onClick={createQuoteFromEstimate}><FileText size={17}/>{savedEstimate?.quote_id?'Quote created':'Create quote'}</button></div></section>
  ];

  return <div className="peBackdrop"><div className="peShell"><header><div className="peBrand"><span><Calculator size={19}/></span><div><strong>Pricing Intelligence</strong><small>60-second cleaning estimate</small></div></div><button type="button" className="peClose" onClick={onClose}><X size={20}/></button></header><div className="peProgress"><span style={{width:`${Math.min(100,(step+1)/6*100)}%`}}/></div><main>{screens[step]}</main>{step<5&&<footer><button type="button" className="peBack" disabled={step===0} onClick={()=>setStep(s=>Math.max(0,s-1))}><ChevronLeft size={18}/> Back</button><button type="button" className="peNext" onClick={()=>setStep(s=>Math.min(5,s+1))}>{step===4?'Calculate price':'Continue'} <ChevronRight size={18}/></button></footer>}</div></div>;
}
