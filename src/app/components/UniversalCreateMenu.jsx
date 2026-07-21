import { useEffect, useMemo, useState } from 'react';
import {
  BriefcaseBusiness,
  Building2,
  Calculator,
  ClipboardCheck,
  FileSignature,
  Files,
  Plus,
  Receipt,
  UserPlus,
  UsersRound,
  X
} from 'lucide-react';

const actions = [
  { key:'lead', label:'New lead', note:'Start a sales opportunity', icon:UserPlus, event:'lead' },
  { key:'estimate', label:'Quick estimate', note:'Price a facility without creating a customer', icon:Calculator, event:'estimate' },
  { key:'saved-estimates', label:'Saved estimates', note:'Continue previous pricing work', icon:Files, event:'saved-estimates' },
  { key:'quote', label:'New quote', note:'Build a customer-ready proposal', icon:BriefcaseBusiness, event:'quote' },
  { key:'agreement', label:'New agreement', note:'Prepare service terms and signature', icon:FileSignature, event:'agreement' },
  { key:'customer', label:'New customer', note:'Add an active customer account', icon:UsersRound, event:'customer' },
  { key:'facility', label:'New facility', note:'Add a service location', icon:Building2, event:'facility' },
  { key:'work-order', label:'New work order', note:'Schedule operational work', icon:ClipboardCheck, event:'work-order' },
  { key:'invoice', label:'New invoice', note:'Create a customer invoice', icon:Receipt, event:'invoice' }
];

export function UniversalCreateMenu({ onEstimate, onSavedEstimates, onQuote }) {
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('');

  useEffect(()=>{
    function shortcut(event){
      if((event.metaKey||event.ctrlKey)&&event.shiftKey&&event.key.toLowerCase()==='p'){
        event.preventDefault();
        setOpen(true);
      }
      if(event.key==='Escape') setOpen(false);
    }
    window.addEventListener('keydown',shortcut);
    return()=>window.removeEventListener('keydown',shortcut);
  },[]);

  const filtered=useMemo(()=>{
    const value=query.trim().toLowerCase();
    if(!value) return actions;
    return actions.filter(action=>`${action.label} ${action.note}`.toLowerCase().includes(value));
  },[query]);

  function run(action){
    setOpen(false);
    setQuery('');
    if(action.event==='estimate') return onEstimate?.();
    if(action.event==='saved-estimates') return onSavedEstimates?.();
    if(action.event==='quote') return onQuote?.();
    window.dispatchEvent(new CustomEvent('facilityos:create',{detail:{type:action.event}}));
  }

  return <>
    <button className="auroraCreateButton" type="button" onClick={()=>setOpen(true)} aria-label="Create new">
      <Plus size={22}/><span>Create</span>
    </button>
    {open&&<div className="auroraCreateBackdrop" onMouseDown={()=>setOpen(false)}>
      <section className="auroraCreateSheet" onMouseDown={event=>event.stopPropagation()} aria-modal="true" role="dialog">
        <header>
          <div><p>Quick create</p><h2>What do you need to do?</h2></div>
          <button type="button" onClick={()=>setOpen(false)} aria-label="Close"><X size={20}/></button>
        </header>
        <input autoFocus value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search actions…" />
        <div className="auroraCreateGrid">
          {filtered.map(action=>{const Icon=action.icon;return <button key={action.key} type="button" onClick={()=>run(action)}>
            <span className="auroraCreateIcon"><Icon size={20}/></span>
            <span><strong>{action.label}</strong><small>{action.note}</small></span>
          </button>})}
        </div>
        <footer><span>Tip: press</span><kbd>⌘ ⇧ P</kbd><span>from anywhere</span></footer>
      </section>
    </div>}
  </>;
}
