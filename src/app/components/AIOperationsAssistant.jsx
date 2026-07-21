import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Bot, CalendarDays, CheckCircle2, ClipboardCheck, DollarSign, FileText, PackageOpen, Search, Send, Sparkles, UsersRound, Wrench } from 'lucide-react';
import './AIOperationsAssistant.css';

const suggestions=[
  ['Show today’s work orders','work-orders',ClipboardCheck],
  ['Show overdue invoices','invoices',DollarSign],
  ['Which facilities need attention?','issues',AlertTriangle],
  ['Create a customer quote','quotes',FileText],
  ['Show low inventory','supplies',PackageOpen],
  ['Open employee performance','employees',UsersRound]
];

function normalize(value=''){return value.toLowerCase().replace(/[’']/g,'').trim()}

function resolveCommand(command){
  const text=normalize(command);
  if(/today|schedule|calendar/.test(text)&&/work|visit|clean/.test(text)) return {page:'calendar',title:'Opening today’s operating schedule'};
  if(/work order|job/.test(text)) return {page:'work-orders',title:'Opening work orders'};
  if(/overdue|unpaid|invoice|balance/.test(text)) return {page:'invoices',title:'Opening invoices and balances'};
  if(/quote|estimate|proposal/.test(text)) return {page:'quotes',title:'Opening quotes'};
  if(/issue|attention|repair|maintenance/.test(text)) return {page:'issues',title:'Opening facility issues'};
  if(/inventory|stock|supply|supplies/.test(text)) return {page:'supplies',title:'Opening supplies and inventory'};
  if(/employee|team|staff|performance/.test(text)) return {page:'employees',title:'Opening employee workspace'};
  if(/customer|client/.test(text)) return {page:'customers',title:'Opening customers'};
  if(/facility|building|location/.test(text)) return {page:'facilities',title:'Opening facilities'};
  if(/inspection|quality|score/.test(text)) return {page:'inspections',title:'Opening inspections'};
  if(/report|analytics|profit|revenue/.test(text)) return {page:'reports',title:'Opening reports'};
  return {page:null,title:'I could not match that command yet',detail:'Try asking about work orders, invoices, customers, facilities, inspections, inventory, employees, issues, quotes, or reports.'};
}

export function AIOperationsAssistant({data,onNavigate}){
  const [command,setCommand]=useState('');
  const [history,setHistory]=useState([]);
  const today=new Date().toISOString().slice(0,10);
  const metrics=useMemo(()=>{
    const todayOrders=(data.workOrders||[]).filter(x=>x.scheduled_date===today&&x.status!=='archived');
    const openIssues=(data.issues||[]).filter(x=>x.status!=='closed');
    const overdueInvoices=(data.invoices||[]).filter(x=>['overdue','unpaid'].includes(x.status));
    const lowStock=(data.inventory||[]).filter(x=>Number(x.quantity_on_hand)<=Number(x.reorder_level));
    return {todayOrders,openIssues,overdueInvoices,lowStock};
  },[data,today]);

  function run(value=command){
    const clean=value.trim();
    if(!clean)return;
    const result=resolveCommand(clean);
    setHistory(current=>[{command:clean,...result,at:new Date()},...current].slice(0,8));
    setCommand('');
    if(result.page) onNavigate(result.page);
  }

  return <div className="page aiOps">
    <section className="aiOpsHero">
      <div className="aiOpsMark"><Bot size={28}/></div>
      <div><p className="eyebrow">Aurora intelligence</p><h1>AI Operations Assistant</h1><p>Ask FacilityOS to find the right workspace, surface priorities, and launch operational actions.</p></div>
    </section>

    <section className="aiOpsBrief">
      <div><span>Today’s work orders</span><strong>{metrics.todayOrders.length}</strong><ClipboardCheck size={18}/></div>
      <div><span>Open issues</span><strong>{metrics.openIssues.length}</strong><Wrench size={18}/></div>
      <div><span>Overdue invoices</span><strong>{metrics.overdueInvoices.length}</strong><DollarSign size={18}/></div>
      <div><span>Low-stock items</span><strong>{metrics.lowStock.length}</strong><PackageOpen size={18}/></div>
    </section>

    <section className="aiOpsComposer">
      <div className="aiOpsInput"><Sparkles size={20}/><input autoFocus value={command} onChange={e=>setCommand(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')run()}} placeholder="Ask FacilityOS anything about operations..."/><button onClick={()=>run()} aria-label="Run command"><Send size={18}/></button></div>
      <div className="aiOpsSuggestions">{suggestions.map(([label,page,Icon])=><button key={label} onClick={()=>{setHistory(current=>[{command:label,page,title:`Opening ${label.toLowerCase()}`,at:new Date()},...current].slice(0,8));onNavigate(page)}}><Icon size={17}/><span>{label}</span><ArrowRight size={15}/></button>)}</div>
    </section>

    <div className="aiOpsGrid">
      <section className="aiOpsPanel"><div className="aiOpsPanelHead"><div><p className="eyebrow">Priority feed</p><h2>Needs attention</h2></div><AlertTriangle size={19}/></div>
        <div className="aiOpsPriority">
          <button onClick={()=>onNavigate('issues')}><AlertTriangle size={18}/><div><strong>{metrics.openIssues.length} unresolved issues</strong><span>Review facility problems and customer requests.</span></div><ArrowRight size={16}/></button>
          <button onClick={()=>onNavigate('invoices')}><DollarSign size={18}/><div><strong>{metrics.overdueInvoices.length} overdue invoices</strong><span>Follow up on balances requiring action.</span></div><ArrowRight size={16}/></button>
          <button onClick={()=>onNavigate('supplies')}><PackageOpen size={18}/><div><strong>{metrics.lowStock.length} low-stock items</strong><span>Prevent supply interruptions before upcoming visits.</span></div><ArrowRight size={16}/></button>
          {!metrics.openIssues.length&&!metrics.overdueInvoices.length&&!metrics.lowStock.length&&<div className="aiOpsClear"><CheckCircle2 size={22}/><strong>No urgent exceptions</strong><span>Operations are currently within normal thresholds.</span></div>}
        </div>
      </section>

      <section className="aiOpsPanel"><div className="aiOpsPanelHead"><div><p className="eyebrow">Command history</p><h2>Recent requests</h2></div><Search size={19}/></div>
        <div className="aiOpsHistory">{history.map((item,index)=><button key={`${item.command}-${index}`} onClick={()=>item.page&&onNavigate(item.page)}><div><strong>{item.command}</strong><span>{item.title}</span></div>{item.page&&<ArrowRight size={16}/>}</button>)}{!history.length&&<div className="aiOpsEmpty"><CalendarDays size={22}/><strong>Your commands will appear here</strong><span>Use a suggestion or type a request above.</span></div>}</div>
      </section>
    </div>
  </div>;
}
