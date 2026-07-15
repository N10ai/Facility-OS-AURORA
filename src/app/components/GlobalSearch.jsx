import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, UsersRound, Building2, ClipboardCheck, ShieldCheck, AlertTriangle, FileText, CircleUserRound } from 'lucide-react';

const groups = [
  ['customers','Customers',UsersRound,'customers','name'],
  ['contacts','Contacts',CircleUserRound,'contacts','full_name'],
  ['facilities','Facilities',Building2,'facilities','name'],
  ['work-orders','Work Orders',ClipboardCheck,'workOrders','title'],
  ['inspections','Inspections',ShieldCheck,'inspections','title'],
  ['issues','Issues',AlertTriangle,'issues','title'],
  ['quotes','Quotes',FileText,'quotes','title'],
  ['invoices','Invoices',FileText,'invoices','invoice_number']
];

export function GlobalSearch({open,onClose,data,onNavigate}) {
  const [query,setQuery]=useState('');
  const [active,setActive]=useState(0);
  const inputRef=useRef(null);

  useEffect(()=>{
    if(open){setQuery('');setActive(0);setTimeout(()=>inputRef.current?.focus(),0)}
  },[open]);

  const results=useMemo(()=>{
    const term=query.trim().toLowerCase();
    if(!term) return [];
    return groups.flatMap(([page,group,Icon,key,labelKey])=>
      (Array.isArray(data?.[key])?data[key]:[])
        .filter(item=>`${item?.[labelKey]||''} ${item?.email||''} ${item?.address||''} ${item?.status||''}`.toLowerCase().includes(term))
        .slice(0,5)
        .map(item=>({page,group,Icon,item,label:item?.[labelKey]||group,detail:item?.email||item?.address||item?.status||''}))
    ).slice(0,24);
  },[data,query]);

  useEffect(()=>{
    if(active>=results.length)setActive(Math.max(0,results.length-1));
  },[active,results.length]);

  function openResult(result){
    onNavigate?.(result.page,result.item);
    onClose?.();
  }

  function onKeyDown(event){
    if(event.key==='Escape')onClose?.();
    if(event.key==='ArrowDown'){event.preventDefault();setActive(v=>Math.min(results.length-1,v+1))}
    if(event.key==='ArrowUp'){event.preventDefault();setActive(v=>Math.max(0,v-1))}
    if(event.key==='Enter'&&results[active])openResult(results[active]);
  }

  if(!open)return null;
  return <div className="globalSearchBackdrop" onMouseDown={onClose}>
    <section className="globalSearchPanel" onMouseDown={event=>event.stopPropagation()}>
      <div className="globalSearchInput"><Search size={20}/><input ref={inputRef} value={query} onChange={event=>setQuery(event.target.value)} onKeyDown={onKeyDown} placeholder="Search customers, facilities, work orders, inspections…"/><button onClick={onClose}><X size={18}/></button></div>
      <div className="globalSearchResults">
        {!query&&<div className="globalSearchEmpty"><strong>Search everything in Aurora</strong><span>Type a customer, facility, employee, work order, inspection, issue, quote, or invoice.</span></div>}
        {!!query&&!results.length&&<div className="globalSearchEmpty"><strong>No results</strong><span>Try a different name, status, email, or address.</span></div>}
        {results.map((result,index)=>{const Icon=result.Icon;return <button key={`${result.group}-${result.item.id||index}`} className={index===active?'globalSearchResult active':'globalSearchResult'} onMouseEnter={()=>setActive(index)} onClick={()=>openResult(result)}><span className="globalSearchIcon"><Icon size={17}/></span><span className="globalSearchText"><strong>{result.label}</strong><small>{result.group}{result.detail?` · ${result.detail}`:''}</small></span><kbd>↵</kbd></button>})}
      </div>
      <footer><span>↑↓ Navigate</span><span>Enter Open</span><span>Esc Close</span></footer>
    </section>
  </div>;
}
