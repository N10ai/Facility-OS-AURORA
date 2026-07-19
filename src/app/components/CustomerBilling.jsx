import { useMemo, useState } from 'react';
import { Banknote, CheckCircle2, Clock3, FileText, Receipt, Search } from 'lucide-react';
import './CustomerBilling.css';

const money = value => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(value||0));
const dateText = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}) : '—';

export function CustomerBilling({ profile, data }) {
  const [tab,setTab]=useState('invoices');
  const [query,setQuery]=useState('');
  const customerId=profile.customer_id;
  const invoices=(data.invoices||[]).filter(row=>row.customer_id===customerId);
  const quotes=(data.quotes||[]).filter(row=>row.customer_id===customerId);
  const payments=(data.payments||[]).filter(row=>row.customer_id===customerId || invoices.some(inv=>inv.id===row.invoice_id));
  const paidByInvoice=useMemo(()=>payments.reduce((map,row)=>{map[row.invoice_id]=(map[row.invoice_id]||0)+Number(row.amount||0);return map;},{}),[payments]);
  const billed=invoices.reduce((sum,row)=>sum+Number(row.total_amount||row.total||row.amount||0),0);
  const paid=payments.reduce((sum,row)=>sum+Number(row.amount||0),0);
  const outstanding=Math.max(0,billed-paid);
  const overdue=invoices.filter(row=>{
    const total=Number(row.total_amount||row.total||row.amount||0);
    const balance=Math.max(0,total-Number(paidByInvoice[row.id]||0));
    return balance>0&&row.due_date&&row.due_date<new Date().toISOString().slice(0,10);
  }).length;
  const source=tab==='quotes'?quotes:tab==='payments'?payments:invoices;
  const visible=source.filter(row=>JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));

  return <div className="page customerBilling">
    <div className="pageHeader"><div><p className="eyebrow">Customer account</p><h1>Billing</h1><p>Review quotes, invoices, payments, balances, and due dates in one place.</p></div></div>
    <div className="stats billingStats">
      <div className="stat"><Receipt size={19}/><strong>{money(billed)}</strong><span>Total invoiced</span><small>{invoices.length} invoices</small></div>
      <div className="stat pastelGreen"><CheckCircle2 size={19}/><strong>{money(paid)}</strong><span>Payments received</span><small>{payments.length} payments</small></div>
      <div className="stat pastelYellow"><Banknote size={19}/><strong>{money(outstanding)}</strong><span>Outstanding balance</span><small>Across open invoices</small></div>
      <div className="stat"><Clock3 size={19}/><strong>{overdue}</strong><span>Past due</span><small>Invoices needing attention</small></div>
    </div>
    <div className="billingToolbar">
      <div className="segmented">{[['invoices','Invoices'],['quotes','Quotes'],['payments','Payments']].map(([key,label])=><button key={key} className={tab===key?'active':''} onClick={()=>setTab(key)}>{label}</button>)}</div>
      <label className="billingSearch"><Search size={17}/><input placeholder={`Search ${tab}`} value={query} onChange={e=>setQuery(e.target.value)}/></label>
    </div>
    <section className="billingList">
      {!visible.length&&<div className="emptyState"><FileText size={30}/><strong>No {tab} found</strong><span>Records created for this customer will appear here.</span></div>}
      {tab==='invoices'&&visible.map(row=>{
        const total=Number(row.total_amount||row.total||row.amount||0);const paidAmount=Number(paidByInvoice[row.id]||0);const balance=Math.max(0,total-paidAmount);
        return <article className="billingRow" key={row.id}><div className="billingIcon"><Receipt size={19}/></div><div><strong>{row.invoice_number||row.number||'Invoice'}</strong><span>{dateText(row.invoice_date||row.created_at?.slice(0,10))} · Due {dateText(row.due_date)}</span></div><div><strong>{money(total)}</strong><span>{balance>0?`${money(balance)} due`:'Paid in full'}</span></div><span className={`statusPill ${balance===0?'success':row.status||'open'}`}>{balance===0?'paid':row.status||'open'}</span></article>;
      })}
      {tab==='quotes'&&visible.map(row=><article className="billingRow" key={row.id}><div className="billingIcon"><FileText size={19}/></div><div><strong>{row.quote_number||row.number||'Quote'}</strong><span>{dateText(row.quote_date||row.created_at?.slice(0,10))}{row.valid_until?` · Valid until ${dateText(row.valid_until)}`:''}</span></div><div><strong>{money(row.total_amount||row.total||row.amount)}</strong><span>{row.title||row.description||'Service proposal'}</span></div><span className={`statusPill ${row.status||'draft'}`}>{row.status||'draft'}</span></article>)}
      {tab==='payments'&&visible.map(row=><article className="billingRow" key={row.id}><div className="billingIcon"><Banknote size={19}/></div><div><strong>{row.reference_number||row.payment_method||'Payment'}</strong><span>{dateText(row.payment_date||row.created_at?.slice(0,10))}</span></div><div><strong>{money(row.amount)}</strong><span>{row.notes||'Payment received'}</span></div><span className="statusPill success">received</span></article>)}
    </section>
  </div>;
}
