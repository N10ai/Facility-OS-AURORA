import { useMemo, useState } from 'react';
import { Calculator, ChevronLeft, ChevronRight, Minus, Plus, Sparkles, X } from 'lucide-react';
import './PricingEngine.css';

const TYPES={office:1,medical:1.28,warehouse:0.82,retail:1.12,school:1.18,church:.92,gym:1.3,restaurant:1.42,other:1};
const SIZE={small:{sqft:1500,label:'Small'},medium:{sqft:4000,label:'Medium'},large:{sqft:10000,label:'Large'},xlarge:{sqft:20000,label:'Very large'}};
const FLOOR={carpet:1.05,lvt:1.12,tile:1.18,concrete:.82,mixed:1.1};
const CONDITION={maintained:.88,average:1,dirty:1.28};
const FREQUENCY={daily:{visits:21,discount:.82,label:'Daily'},three:{visits:13,discount:.88,label:'3× / week'},weekly:{visits:4.33,discount:1,label:'Weekly'},biweekly:{visits:2.17,discount:1.08,label:'Every 2 weeks'},monthly:{visits:1,discount:1.18,label:'Monthly'}};

const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n||0);
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));

function Counter({label,value,onChange}){
  return <div className="peCounter"><span>{label}</span><div><button onClick={()=>onChange(Math.max(0,value-1))}><Minus size={16}/></button><strong>{value}</strong><button onClick={()=>onChange(value+1)}><Plus size={16}/></button></div></div>;
}

export function PricingEngine({open,onClose}){
  const [step,setStep]=useState(0);
  const [form,setForm]=useState({type:'office',size:'medium',sqft:'',employees:12,desks:10,restrooms:2,kitchens:1,conference:1,warehouse:'none',floor:'mixed',frequency:'weekly',condition:'average'});
  const set=(key,value)=>setForm(current=>({...current,[key]:value}));

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

  if(!open)return null;
  const screens=[
    <section><p className="peEyebrow">Step 1 of 5</p><h2>What are you cleaning?</h2><p>Choose the closest facility type.</p><div className="peChoices peGrid">{Object.keys(TYPES).map(type=><button key={type} className={form.type===type?'active':''} onClick={()=>set('type',type)}>{type[0].toUpperCase()+type.slice(1)}</button>)}</div></section>,
    <section><p className="peEyebrow">Step 2 of 5</p><h2>About how big is it?</h2><p>No measuring required. Choose a range or enter approximate square feet.</p><div className="peChoices">{Object.entries(SIZE).map(([key,item])=><button key={key} className={form.size===key?'active':''} onClick={()=>set('size',key)}><strong>{item.label}</strong><span>≈ {item.sqft.toLocaleString()} sq ft</span></button>)}</div><label className="peField">Approximate square feet <span>(optional)</span><input type="number" placeholder="Example: 3500" value={form.sqft} onChange={e=>set('sqft',e.target.value)}/></label></section>,
    <section><p className="peEyebrow">Step 3 of 5</p><h2>What does it have?</h2><p>Only count the obvious items. A rough number is enough.</p><div className="peCounters"><Counter label="Employees" value={form.employees} onChange={v=>set('employees',v)}/><Counter label="Desks" value={form.desks} onChange={v=>set('desks',v)}/><Counter label="Restrooms" value={form.restrooms} onChange={v=>set('restrooms',v)}/><Counter label="Kitchens / break rooms" value={form.kitchens} onChange={v=>set('kitchens',v)}/><Counter label="Conference rooms" value={form.conference} onChange={v=>set('conference',v)}/></div><div className="peSegment"><span>Warehouse area</span>{['none','small','large'].map(v=><button key={v} className={form.warehouse===v?'active':''} onClick={()=>set('warehouse',v)}>{v}</button>)}</div></section>,
    <section><p className="peEyebrow">Step 4 of 5</p><h2>Floor and condition</h2><p>Choose what covers most of the cleanable space.</p><div className="peChoices peGrid">{Object.keys(FLOOR).map(v=><button key={v} className={form.floor===v?'active':''} onClick={()=>set('floor',v)}>{v.toUpperCase()}</button>)}</div><h3>Current condition</h3><div className="peChoices">{[['maintained','Well maintained'],['average','Average'],['dirty','Needs deep cleaning']].map(([v,label])=><button key={v} className={form.condition===v?'active':''} onClick={()=>set('condition',v)}>{label}</button>)}</div></section>,
    <section><p className="peEyebrow">Step 5 of 5</p><h2>How often?</h2><p>Recurring frequency changes setup efficiency and the monthly value.</p><div className="peChoices">{Object.entries(FREQUENCY).map(([v,item])=><button key={v} className={form.frequency===v?'active':''} onClick={()=>set('frequency',v)}>{item.label}</button>)}</div></section>,
    <section className="peResult"><div className="peResultTop"><div><p className="peEyebrow"><Sparkles size={14}/> Smart recommendation</p><h2>{money(result.recommended)} <span>/ visit</span></h2><p>{money(result.monthly)} estimated monthly revenue</p></div><div className="peConfidence"><strong>{result.confidence}%</strong><span>confidence</span></div></div><div className="pePriceBand"><div><span>Minimum</span><strong>{money(result.minimum)}</strong></div><div className="featured"><span>Recommended</span><strong>{money(result.recommended)}</strong></div><div><span>Premium</span><strong>{money(result.premium)}</strong></div></div><div className="peFacts"><div><span>Estimated labor</span><strong>{result.hours.toFixed(1)} hr</strong></div><div><span>Suggested crew</span><strong>{result.crew}</strong></div><div><span>Supplies</span><strong>{money(result.supplyCost)}</strong></div><div><span>Gross margin</span><strong>{Math.round(result.margin)}%</strong></div></div><div className="peExplain">Based on an approximately {result.sqft.toLocaleString()} sq ft {form.type} with {form.restrooms} restroom{form.restrooms===1?'':'s'}, {form.desks} desks, {form.floor.toUpperCase()} flooring and {FREQUENCY[form.frequency].label.toLowerCase()} service.</div><div className="peResultActions"><button className="peSecondary" onClick={()=>setStep(0)}>Start over</button><button className="pePrimary" onClick={()=>navigator.clipboard?.writeText(`Recommended cleaning price: ${money(result.recommended)} per visit (${money(result.monthly)}/month)`) }>Copy estimate</button></div></section>
  ];

  return <div className="peBackdrop"><div className="peShell"><header><div className="peBrand"><span><Calculator size={19}/></span><div><strong>Pricing Intelligence</strong><small>60-second cleaning estimate</small></div></div><button className="peClose" onClick={onClose}><X size={20}/></button></header><div className="peProgress"><span style={{width:`${Math.min(100,(step+1)/6*100)}%`}}/></div><main>{screens[step]}</main>{step<5&&<footer><button className="peBack" disabled={step===0} onClick={()=>setStep(s=>Math.max(0,s-1))}><ChevronLeft size={18}/> Back</button><button className="peNext" onClick={()=>setStep(s=>Math.min(5,s+1))}>{step===4?'Calculate price':'Continue'} <ChevronRight size={18}/></button></footer>}</div></div>;
}
